import { fileServer, http, httpErrors, path } from "../deps.ts";
import config from "./config.ts";

export const startServer = async () => {
  await http.serve(async (req) => {
    await authorize(req);
    if (req.method === "GET") return await handleGet(req);
    if (req.method === "PUT") return await handlePut(req);
    if (req.method === "DELETE") return handleDelete(req);
    throw httpErrors.createHttpError(405);
  }, {
    onError: (err) => {
      let sentErr: httpErrors.HttpError;
      if (httpErrors.isHttpError(err)) sentErr = err;
      else {
        console.error(err);
        sentErr = httpErrors.createHttpError(500);
      }
      return new Response(sentErr.message, { status: sentErr.status });
    },
  });
};

async function authorize(_req: Request) {
  // TODO: implement authorizer
}

async function handleGet(req: Request) {
  const res = await fileServer.serveDir(req, { fsRoot: config.dataDir });
  if (res.status === 404) {
    // TODO: query NATS
    return res;
  }
  return res;
}

async function handlePut(req: Request) {
  try {
    const targetPath = pathFromRequest(req);
    await Deno.mkdir(path.dirname(targetPath), { recursive: true });
    const f = await Deno.open(targetPath, { write: true, create: true });
    if (req.body) await req.body.pipeTo(f.writable);
    else f.close();

    return new Response("Created", {
      status: 201,
      headers: { Location: req.url },
    });
  } catch (e) {
    if (e instanceof Deno.errors.AlreadyExists) {
      throw httpErrors.createHttpError(
        422,
        "Non-directory file already exists on this path - delete it first",
      );
    } else if (
      e instanceof Error && (e as unknown as { code: string }).code === "EISDIR"
    ) {
      throw httpErrors.createHttpError(
        422,
        "Target is a directory - delete it first",
      );
    } else throw e;
  }
}

function handleDelete(req: Request) {
  Deno.remove(pathFromRequest(req), { recursive: true })
    .catch((e) => {
      if (!(e instanceof Deno.errors.NotFound)) {
        console.error(new Error(e.message)); // recreate an error to get a stack trace pointing here
      }
    });
  return new Response(null, { status: 204 });
}

function pathFromRequest(req: Request) {
  const key = path.normalize(new URL(req.url).pathname).slice(1);
  if (!key) {
    throw httpErrors.createHttpError(
      422,
      "Can't PUT/DELETE at root ('/') path",
    );
  }
  return path.resolve(config.dataDir, key);
}
