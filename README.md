# hieuuPenguin Blog

A static Astro blog for publishing CVE notes and CTF writeups.

![Astro](https://img.shields.io/badge/Astro-6.x-BC52EE?logo=astro)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss)
![GitHub Pages](https://img.shields.io/badge/deploy-GitHub_Pages-181717?logo=github)

## Features

- **Markdown and MDX posts** for technical writeups.
- **CTF/CVE categories and tags** for browsing by event, topic, or vulnerability type.
- **Search index** generated at build time.
- **Syntax highlighting** with Shiki.
- **Math rendering** with KaTeX.
- **Responsive layout** for desktop and mobile readers.
- **GitHub Pages deployment** through GitHub Actions.

## Tech Stack

| Tool | Purpose |
| --- | --- |
| [Astro 6](https://astro.build) | Static site generation |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling |
| [MDX](https://mdxjs.com) | Markdown with components |
| [Shiki](https://shiki.style) | Code highlighting |
| [KaTeX](https://katex.org) | Math rendering |
| [GitHub Actions](https://github.com/features/actions) | GitHub Pages deployment |

## Getting Started

### Requirements

- Node.js 20 or newer
- npm

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open <http://localhost:4321> in your browser.

### Build

```bash
npm run build
```

The production output is generated in `dist/`.

### Preview the Production Build

```bash
npm run preview
```

## Project Configuration

Main site settings live in `src/consts.ts`:

```ts
export const SITE_TITLE = 'hieuuPenguin Blog';
export const SITE_DESCRIPTION = 'CVE & CTF writeups by hieuuPenguin';
export const SITE_AUTHOR = 'hieuuPenguin';
export const SITE_URL = 'https://example.github.io';
```

Astro build settings live in `astro.config.ts`. Before deploying to GitHub Pages, set the `site` value to the final public URL, for example:

```ts
export default defineConfig({
  site: 'https://your-username.github.io',
});
```

## Writing Posts

Published posts are stored under `src/content/blog/`.

The recommended structure is one folder per post:

```text
src/content/blog/
`-- tjctf-2026-paper-trail/
    |-- index.md
    |-- cover.png
    `-- image.png
```

Example frontmatter:

```yaml
---
title: "TJCTF2026-web/paper-trail"
description: "CTF writeup - web/paper-trail (TJCTF 2026)"
date: 2026-05-17
tags: [CTF, Web, TJCTF]
category: "TJCTF 2026"
cover: ./cover.png
pinned: false
draft: false
---
```

Supported frontmatter fields:

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Required post title |
| `description` | string | Optional summary |
| `date` | date | Publish date |
| `updated` | date | Optional update date |
| `tags` | string array | Used by tag pages |
| `category` | string | Used by category pages |
| `cover` | string | Local relative image path or remote URL |
| `pinned` | boolean | Pins a post when supported by the layout |
| `draft` | boolean | Draft posts are excluded from normal publishing |

Images can be referenced from the same post folder:

```md
![Request flow](./image.png)
```

## GitHub Pages Deployment

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

Deployment flow:

1. Push changes to the `main` branch.
2. GitHub Actions runs `astro build`.
3. The generated `dist/` output is deployed to GitHub Pages.

In the GitHub repository settings, configure Pages to use **GitHub Actions** as the build and deployment source.

If this is a user site, the repository name should normally be:

```text
your-username.github.io
```

## Useful Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Directory Structure

```text
.
|-- .github/workflows/      # GitHub Pages deployment workflow
|-- public/                 # Static assets
|   |-- avt.jpg
|   |-- ctf/
|   `-- favicon.svg
|-- src/
|   |-- components/         # Astro UI components
|   |-- content/blog/       # Published writeups
|   |-- layouts/            # Page layouts
|   |-- pages/              # Routes
|   |-- styles/             # Global styles
|   `-- utils/              # Utility functions
|-- upctf/                  # Source CTF notes and assets
|-- upcve/                  # Source CVE notes and assets
|-- astro.config.ts
|-- package.json
`-- src/consts.ts
```

## Notes

- Do not commit `node_modules/`, `dist/`, or `.astro/`; they are ignored by `.gitignore`.
- Keep final published posts in `src/content/blog/`.
- Use `upctf/` and `upcve/` as working/source folders when preparing writeups.

## License

ISC
