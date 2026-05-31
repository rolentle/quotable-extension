import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { buildMarkdown, slugify } from "./utils";

const QUOTES_DIR =
  process.env.QUOTES_DIR ?? join(import.meta.dir, "../../rolentle/src/content/quotes");
const PORT = Number(process.env.PORT ?? 7331);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

await mkdir(QUOTES_DIR, { recursive: true });

async function uniqueFilePath(slug: string): Promise<string> {
  let candidate = join(QUOTES_DIR, `${slug}.md`);
  if (!(await Bun.file(candidate).exists())) return candidate;
  for (let i = 2; i < 100; i++) {
    candidate = join(QUOTES_DIR, `${slug}-${i}.md`);
    if (!(await Bun.file(candidate).exists())) return candidate;
  }
  throw new Error("Too many duplicate slugs");
}

Bun.serve({
  port: PORT,
  routes: {
    "/api/quotes": {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async (req) => {
        let body: any;
        try {
          body = await req.json();
        } catch {
          return Response.json(
            { error: "Invalid JSON" },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        const { text, url, pageTitle, notes, author } = body ?? {};

        if (!text || typeof text !== "string" || text.trim().length < 10) {
          return Response.json(
            { error: "text must be at least 10 characters" },
            { status: 400, headers: CORS_HEADERS }
          );
        }
        if (!url || typeof url !== "string") {
          return Response.json(
            { error: "url is required" },
            { status: 400, headers: CORS_HEADERS }
          );
        }

        const title =
          typeof pageTitle === "string" && pageTitle.trim()
            ? pageTitle.trim()
            : url;
        const { content, dateStr } = buildMarkdown(text, url, title, notes, author);
        const slug = `${dateStr}-${slugify(title)}`;

        try {
          const filePath = await uniqueFilePath(slug);
          await Bun.write(filePath, content);
          const filename = filePath.split("/").pop()!;
          console.log(`Saved: ${filename}`);
          return Response.json(
            { success: true, file: filename },
            { headers: CORS_HEADERS }
          );
        } catch (err) {
          console.error(err);
          return Response.json(
            { error: "Failed to write file" },
            { status: 500, headers: CORS_HEADERS }
          );
        }
      },
    },
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Quotable server running on http://localhost:${PORT}`);
console.log(`Writing quotes to: ${QUOTES_DIR}`);
