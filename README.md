# Furnace

A terminal-first agentic coding harness. Built in the open, run it in your repository.

This is the landing page and documentation site for [Furnace](https://github.com/amoreX/furnace).

## Stack

- [Vite](https://vitejs.dev/) — build tooling
- [React](https://react.dev/) — UI library
- [React Router](https://reactrouter.com/) — client-side routing
- [Tailwind CSS v4](https://tailwindcss.com/) — styling

## Getting started

```bash
npm ci
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Commands

```bash
npm run build       # production bundle in dist/
npm run preview     # serve the production bundle
npm test            # Vitest unit/component suite
npm run test:watch  # Vitest watch mode
npm run test:e2e    # full Playwright suite
npm run check       # unit tests, then production build
npm run releases:sync # sync Git-derived release notes from Furnace
```

## Project structure

```
docs/                  # Markdown documentation sources
e2e/                   # Playwright route, interaction, and asset tests
public/
  assets/
    background/        # Global WebGL normal map
    brand/             # Furnace logo
    contributors/      # Contributor coin normal maps
    features/          # Feature images and matching normal maps
  fonts/               # Self-hosted font files and @font-face styles
src/
  components/
    docs/               # Docs shell, Markdown renderer, and noise layer
    effects/            # Canvas/WebGL effects and lifecycle utilities
    features/           # Shared feature grid and card renderer
    site/               # Global chrome and footer
  data/                 # Feature content and asset paths
  hooks/                # Theme and clipboard state
  pages/                # Home, Features, Changelog, and Docs routes
  test/                 # Shared Vitest setup
  App.jsx               # Routing and persistent site layers
  index.css             # Tailwind entry, theme tokens, and global styles
  main.jsx              # React entry point
```

## Architecture

`App.jsx` keeps the global background and chrome mounted while React Router
switches page content. Documentation imports Markdown as build-time raw text.
Files under `public/` retain root-relative URLs because WebGL textures and
feature data load them dynamically.

Canvas effects share one reference-counted pointer listener. Their render loops
pause when hidden or offscreen, respect reduced motion, redraw on relevant
theme/resize activity, recover WebGL context loss, and release observers,
listeners, texture loads, and GPU resources on unmount.

## Local simplification skill

Before behavior-preserving cleanup, read
`.cursor/skills/code-simplification/SKILL.md` and work review-first: understand
callers and tests, make only verified simplifications, and verify each change.
The skill is vendored from an immutable upstream revision; provenance and
update instructions are in `.cursor/skills/code-simplification/UPSTREAM.md`.

## License

MIT
