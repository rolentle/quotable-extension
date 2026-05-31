# Quotable

A Chrome extension + local API server for saving highlighted text as quote posts on your Astro blog, inspired by [Simon Willison's quotation posts](https://simonwillison.net/quotes/).

## How it works

1. Highlight text on any webpage
2. Click the "Save Quote" button that appears
3. Add optional notes and author, then save
4. A markdown file is written to your Astro blog's content directory
5. The quote appears at `/quotes/` on your blog

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Start the API server

```bash
bun run server
```

The server runs on `http://localhost:7331` and writes quote files to `../rolentle/src/content/quotes/` by default. Override the path with an environment variable:

```bash
QUOTES_DIR=/path/to/your/blog/src/content/quotes bun run server
```

### 3. Load the Chrome extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder in this repo

The extension is now active on all pages.

## Usage

1. Make sure the server is running (`bun run server`)
2. On any webpage, highlight at least 10 characters of text
3. A **Save Quote** button appears near your selection — click it
4. In the modal:
   - Review the captured quote
   - Add optional **notes** (your commentary)
   - Add optional **author** name
5. Click **Save Quote** — you'll see "Quote saved!" on success

The quote is written as a markdown file in your Astro blog's `src/content/quotes/` directory and is immediately available in dev mode.

## Project structure

```
quotable/
├── server/index.ts       # Bun API server (port 7331)
├── extension/
│   ├── manifest.json     # Chrome MV3 manifest
│   ├── content.js        # Selection UI and save logic
│   └── styles.css        # Extension styles
└── package.json
```

## Quote file format

Each saved quote becomes a markdown file like `2026-05-30-page-title.md`:

```markdown
---
title: "Page Title"
date: 2026-05-30
url: "https://example.com/article"
sourceTitle: "Page Title"
author: "Optional Author"
tags: []
---

> The highlighted text goes here.

— [Page Title](https://example.com/article)

Your optional notes appear here.
```

## Astro blog setup

The quotes collection is already configured in `../rolentle/src/content.config.ts`. Pages live at:

- `/quotes/` — all quotes, newest first
- `/quotes/[slug]/` — individual quote

If you're using a different Astro blog, add this to your `src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const quotes = defineCollection({
  loader: glob({ base: './src/content/quotes', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    url: z.string().url(),
    sourceTitle: z.string(),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});
```
