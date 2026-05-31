export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 6)
    .join("-");
  return slug || "untitled";
}

export function escapeYaml(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ")
    .trim();
}

export function formatBlockquote(text: string): string {
  return text
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export function buildMarkdown(
  text: string,
  url: string,
  pageTitle: string,
  notes?: string,
  author?: string,
  date: Date = new Date()
): { content: string; dateStr: string } {
  const dateStr = date.toISOString().split("T")[0];
  const titleEscaped = escapeYaml(pageTitle);
  const urlEscaped = escapeYaml(url);

  let frontmatter = `---\ntitle: "${titleEscaped}"\ndate: ${dateStr}\nurl: "${urlEscaped}"\nsourceTitle: "${titleEscaped}"`;
  if (author?.trim()) frontmatter += `\nauthor: "${escapeYaml(author)}"`;
  frontmatter += `\ntags: []\n---`;

  let body = `\n${formatBlockquote(text)}\n\n— [${pageTitle.trim()}](${url})`;
  if (notes?.trim()) body += `\n\n${notes.trim()}`;

  return { content: `${frontmatter}\n${body}\n`, dateStr };
}
