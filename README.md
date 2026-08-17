# Bloom 🌸

A soft, pastel daily dashboard for Obsidian — tasks, calendar, trackers, and reading in one calm view.

> UI: English · Theme: **pastel-fresh** (soft pinks, peaches, sage, periwinkle)

## Features

- **Dashboard** — greeting + 4 KPI cards (Tasks / Weight / Cycle / Reading), Today's Tasks (2/5), Active Projects with gradient progress, Daily Flow tiles, Expenses breakdown, Wellness, Library.
- **Tasks** — a "Task Board" with To Do / In Progress / Done columns, category tags (Daily / Project / Learning), and progress bars.
- **Calendar** — a full month grid (computed from `new Date()`), event strokes, an Important Dates side panel, and today's Daily Note preview.
- **Trackers** — Weight trend, Expense breakdown, Cycle ring, and This Month summary.
- **Sidebar** — 8 items: Home / Today / Tasks / Calendar / Trackers / Learning / Books / Projects.
- **Light / Dark** — a toggle that swaps the `.theme-dark` class, reusing the pastel-fresh dark tokens.

## Data sources

Bloom reads your **existing Markdown notes** — there is no separate database:

| View | Reads from |
|------|-----------|
| Tasks / Today | `11-Todo/*.md` (`- [ ]` / `- [x]`) |
| Projects & progress | `10-Projects/Project Dashboard.md` (`### N. Name` + `<progress>`) |
| Weight / Cycle / Expense | `13-Trackers/*.md` tables |
| Calendar & events | `12-Calendar/Monthly Calendar.md` + `Daily Notes/<date>.md` |
| Library | `14-Learning` + `15-Books` |

If a file is missing, Bloom falls back to safe static placeholders — it never blanks the UI.

## Installation

### Option A — Obsidian BRAT (easiest)
1. Install the **BRAT** community plugin.
2. `Add a beta plugin` and paste the repository URL.
3. Enable **Bloom** in Community plugins, then reload.

### Option B — Manual build
```bash
git clone https://github.com/shuixiande/bloom-obsidian-plugin.git
cd bloom-obsidian-plugin
npm install
npm run build
mkdir -p "<vault>/.obsidian/plugins/bloom"
cp main.js styles.css manifest.json "<vault>/.obsidian/plugins/bloom/"
```
Enable **Bloom** in *Settings → Community plugins* and reload Obsidian.

### Open the dashboard
- Click the dashboard ribbon icon, or
- open the command palette and run **"Open Bloom dashboard"**.

## Development
- `npm run dev` — esbuild watch mode.
- `prototype.html` — a standalone, data-stub preview that needs no Obsidian. It reuses the same `src/dashboard.ts` render layer as the plugin, so the prototype and the real plugin can never drift apart.

## Project structure
```
src/
  main.ts        Obsidian ItemView + plugin entry (ribbon, commands, theme)
  dashboard.ts   single render layer (shell + 4 views) — shared by plugin & prototype
  data.ts        static fallback dataset (baseline)
  vault.ts       live reader (app.vault.adapter) — Obsidian only
  prototype.ts   browser bootstrap for prototype.html
esbuild.config.mjs   builds main.js (cjs) + prototype.js (iife)
manifest.json        Obsidian plugin manifest
styles.css           pastel-fresh styling + light/dark tokens
prototype.html       standalone preview
```

## Docs
- [VAULT-SETUP.md](VAULT-SETUP.md) — how to build a vault that Bloom understands.
- [RELEASE.md](RELEASE.md) — release notes (currently v0.1.1).

## License
MIT — see [LICENSE](LICENSE).
