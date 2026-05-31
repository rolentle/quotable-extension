import { describe, expect, test } from "bun:test";
import { buildMarkdown, escapeYaml, formatBlockquote, slugify } from "./utils";

const FIXED_DATE = new Date("2026-05-31T00:00:00.000Z");

describe("slugify", () => {
  test("lowercases and hyphenates words", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  test("strips special characters", () => {
    expect(slugify("What's the deal?")).toBe("whats-the-deal");
  });

  test("truncates to 6 words", () => {
    expect(slugify("one two three four five six seven eight")).toBe(
      "one-two-three-four-five-six"
    );
  });

  test("collapses multiple spaces and hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world");
    expect(slugify("hello--world")).toBe("hello-world");
  });

  test("falls back to 'untitled' when result is empty", () => {
    expect(slugify("???!!!")).toBe("untitled");
    expect(slugify("")).toBe("untitled");
  });

  test("handles unicode by stripping non-ASCII word chars", () => {
    expect(slugify("Héllo Wörld")).toBe("hllo-wrld");
  });
});

describe("escapeYaml", () => {
  test("escapes double quotes", () => {
    expect(escapeYaml(`She said "hello"`)).toBe(`She said \\"hello\\"`);
  });

  test("escapes backslashes", () => {
    expect(escapeYaml("path\\to\\file")).toBe("path\\\\to\\\\file");
  });

  test("collapses newlines to a space", () => {
    expect(escapeYaml("line one\nline two")).toBe("line one line two");
    expect(escapeYaml("line one\r\nline two")).toBe("line one line two");
  });

  test("trims surrounding whitespace", () => {
    expect(escapeYaml("  hello  ")).toBe("hello");
  });
});

describe("formatBlockquote", () => {
  test("prefixes a single line with '> '", () => {
    expect(formatBlockquote("Hello world")).toBe("> Hello world");
  });

  test("prefixes each line of a multi-line string", () => {
    expect(formatBlockquote("line one\nline two")).toBe("> line one\n> line two");
  });

  test("trims leading and trailing whitespace before formatting", () => {
    expect(formatBlockquote("  hello  ")).toBe("> hello");
  });
});

describe("buildMarkdown", () => {
  const text = "This is a sample quote for testing purposes.";
  const url = "https://example.com/article";
  const pageTitle = "Example Article";

  test("produces valid frontmatter with required fields", () => {
    const { content } = buildMarkdown(text, url, pageTitle, undefined, undefined, FIXED_DATE);
    expect(content).toContain('title: "Example Article"');
    expect(content).toContain("date: 2026-05-31");
    expect(content).toContain(`url: "${url}"`);
    expect(content).toContain(`sourceTitle: "Example Article"`);
    expect(content).toContain("tags: []");
  });

  test("returns the date string", () => {
    const { dateStr } = buildMarkdown(text, url, pageTitle, undefined, undefined, FIXED_DATE);
    expect(dateStr).toBe("2026-05-31");
  });

  test("wraps text as a blockquote", () => {
    const { content } = buildMarkdown(text, url, pageTitle, undefined, undefined, FIXED_DATE);
    expect(content).toContain(`> ${text}`);
  });

  test("includes attribution line", () => {
    const { content } = buildMarkdown(text, url, pageTitle, undefined, undefined, FIXED_DATE);
    expect(content).toContain(`— [${pageTitle}](${url})`);
  });

  test("omits author field when not provided", () => {
    const { content } = buildMarkdown(text, url, pageTitle, undefined, undefined, FIXED_DATE);
    expect(content).not.toContain("author:");
  });

  test("includes author field when provided", () => {
    const { content } = buildMarkdown(text, url, pageTitle, undefined, "Jane Smith", FIXED_DATE);
    expect(content).toContain('author: "Jane Smith"');
  });

  test("omits notes when not provided", () => {
    const { content } = buildMarkdown(text, url, pageTitle, undefined, undefined, FIXED_DATE);
    const bodyAfterAttribution = content.split(`— [${pageTitle}](${url})`)[1];
    expect(bodyAfterAttribution.trim()).toBe("");
  });

  test("appends notes after attribution when provided", () => {
    const { content } = buildMarkdown(text, url, pageTitle, "My thoughts here.", undefined, FIXED_DATE);
    expect(content).toContain("My thoughts here.");
    const notesIndex = content.indexOf("My thoughts here.");
    const attributionIndex = content.indexOf(`— [${pageTitle}]`);
    expect(notesIndex).toBeGreaterThan(attributionIndex);
  });

  test("omits notes when only whitespace", () => {
    const { content } = buildMarkdown(text, url, pageTitle, "   ", undefined, FIXED_DATE);
    const bodyAfterAttribution = content.split(`— [${pageTitle}](${url})`)[1];
    expect(bodyAfterAttribution.trim()).toBe("");
  });

  test("escapes quotes in title for YAML safety", () => {
    const { content } = buildMarkdown(
      text, url, `Article with "quotes"`, undefined, undefined, FIXED_DATE
    );
    expect(content).toContain('title: "Article with \\"quotes\\""');
  });

  test("handles multi-line quote text", () => {
    const multiLine = "First line.\nSecond line.";
    const { content } = buildMarkdown(multiLine, url, pageTitle, undefined, undefined, FIXED_DATE);
    expect(content).toContain("> First line.\n> Second line.");
  });
});
