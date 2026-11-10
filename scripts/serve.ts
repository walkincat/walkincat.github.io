// Minimal static server for out/ used by CI layout checks (dir -> index.html, 404.html fallback).
import { existsSync, statSync } from "node:fs";
import { join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dir, "..", process.argv[2] ?? "out");
const port = Number(process.env.PORT ?? 4173);

Bun.serve({
  port,
  fetch(req) {
    const pathname = decodeURIComponent(new URL(req.url).pathname);
    const file = normalize(join(root, pathname));
    if (!file.startsWith(root)) return new Response("forbidden", { status: 403 });
    if (existsSync(file) && statSync(file).isFile()) return new Response(Bun.file(file));
    const index = join(file, "index.html");
    if (existsSync(index)) {
      if (!pathname.endsWith("/")) return Response.redirect(`${pathname}/`, 308);
      return new Response(Bun.file(index));
    }
    return new Response(Bun.file(join(root, "404.html")), { status: 404 });
  },
});
console.log(`[serve] ${root} on http://localhost:${port}`);
