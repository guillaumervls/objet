import { dotenv } from "./deps.ts";
import { startServer } from "./src/server.ts";

if (import.meta.main) {
  await main();
} else {
  console.error("Cannot import this file: it should be run directly.");
  Deno.exit(1);
}

async function main() {
  await dotenv.load({ export: true });
  await startServer();
}
