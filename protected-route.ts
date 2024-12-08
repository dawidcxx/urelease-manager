import {  Middleware } from "@oak/oak";

const USERNAME = Deno.env.get('RELEASE_MANAGER_USER') ?? 'release_manager';
const PASSWORD = Deno.env.get('RELEASE_MANAGER_PASSWORD') ?? 'release_manager';

export const basicAuth: Middleware = async (ctx, next) => {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader) {
    ctx.response.status = 401;
    ctx.response.headers.set(
      "WWW-Authenticate",
      'Basic realm="Access to the site"'
    );
    ctx.response.body = { message: "Unauthorized" };
    return;
  }

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) {
    ctx.response.status = 400;
    ctx.response.body = { message: "Invalid Authorization header" };
    return;
  }

  const decoded = atob(encoded);
  const [username, password] = decoded.split(":");

  if (username === USERNAME && password === PASSWORD) {
    await next();
  } else {
    ctx.response.status = 401;
    ctx.response.body = "Invalid credentials";
  }
};

