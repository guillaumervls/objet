FROM denoland/deno:alpine

WORKDIR /objet

COPY . $WORKDIR

RUN deno cache main.ts

CMD [ "deno", "run", "-A", "main.ts" ]