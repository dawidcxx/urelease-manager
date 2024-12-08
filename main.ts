import { Application, Router } from "@oak/oak";
import { mapOptional } from "./util.ts";

const router = new Router();

router.get("/", (ctx) => {
  ctx.response.body = "Hello world";
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({
  port:
    mapOptional(Deno.env.get("RELEASE_MANAGER_PORT"), (it) => parseInt(it)) ??
    7313,
});
