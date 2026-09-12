# Contributing to Bloom

Thanks for your interest in improving Bloom! 🌸

## Getting started

```bash
git clone https://github.com/shuixiande/bloom-obsidian-plugin.git
cd bloom-obsidian-plugin
npm install
npm run dev     # dev build with inline sourcemaps (main.js + prototype.js)
```

Open the folder as an Obsidian vault (or symlink it into `.obsidian/plugins/bloom/`)
and reload Bloom in **Settings → Community plugins** after each build.

## Project layout

```
src/main.ts        plugin entry: view lifecycle, vault write-back, modals
src/dashboard.ts   render layer: HTML template strings for all views
src/vault.ts       data layer: reads/writes Markdown tables in the vault
src/data.ts        types + static fallback data
src/entry-modal.ts reusable field-driven modal (text/number/select)
src/task-modal.ts  single-field task modal
src/settings.ts    settings tab
src/prototype.ts   standalone browser demo (prototype.html + prototype.js)
styles.css         all plugin styles (`.bloom`-scoped)
```

## Guidelines

- Keep the render layer pure: views are template strings, all state flows
  through `BloomData` — no direct DOM state outside event wiring.
- Every write must go through `src/vault.ts` helpers so data stays in the
  user's Markdown files.
- Run `npx tsc --noEmit` before committing — it must pass with no errors.
- Match the existing pastel visual language (see `styles.css` custom props).

## Submitting changes

1. Fork / create a feature branch.
2. Make your change, keep commits focused.
3. Verify in Obsidian: tasks, expense, book, and study add-flows still work.
4. Open a pull request with a short description and screenshots if UI changed.

## Reporting issues

Open a GitHub issue with your Obsidian version, OS, and steps to reproduce.
Console output (Ctrl+Shift+I) is very helpful.
