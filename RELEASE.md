# Bloom v0.1.2 — Release Notes

**Released:** 2026-08-18
**Tag:** `v0.1.2`
**Status:** Calendar + Dashboard redesign

## What's new

### 🗓️ Calendar redesigned — full-width, per-day event cards
The calendar now mirrors a horizontal monthly grid where **each day cell is a tall card** containing its own event list (matching the reference layout):
- **Day number + lunar date** (`16` + `(廿三)`) at the top of every cell.
- **Holiday banner** in copper (`#b87b5a`) for Chinese public holidays (教师节, 中秋节, 国庆节, …) — auto-detected via `lunar-typescript`.
- **Timed events** inside each cell, rendered as `● 8pm Medication (Time Blocking)` with colored dots.
- **Today** highlighted with pink fill + left accent stripe.
- **Weekend** cells get a subtle warmer tint.
- A new **"Today"** button (top-left of the calendar header) jumps back to the current month.
- The 300 px right side panel is **removed** — important dates now live inside cells, where they belong.

### 🏠 Dashboard simplified — one card, one task
The previous 4-stat-strip + 2-column body was too noisy for a "single-thread" brain. v0.1.2 replaces the entire Home view with **one big "Today's #1" card**:
- Eyebrow `TODAY'S #1`, big title (28 px), optional description.
- Circular check button (top-right) flips done state and writes back to the source Markdown file.
- Footer shows source file + remaining tasks count.
- Falls back to "first unchecked Daily Task" if today's Daily Note frontmatter doesn't define `topTask:`.

### 🛠️ Under the hood
- New dependency: `lunar-typescript` (~20 KB, offline, covers 1900–2100). Bundled into `main.js` (~465 KB total).
- New vault parsers:
  - **`topTask` frontmatter** on the current `Daily Notes/<today>.md`.
  - **`## ⏰ Schedule` table** on every Daily Note in the current month — aggregated into the per-day cells.
- New `Daily Note Template.md` fields: `topTask: ""` in frontmatter + a `## ⏰ Schedule` table with example rows.
- Calendar grid render shared between initial paint and month-navigation (single source of truth, no drift).
- Render-layer rebuild: removed 6 obsolete home cards (stat strip, Active Projects, Daily Flow, Expenses, Wellness, Library) — the underlying data still flows through for `Tasks` and `Trackers`.

## Breaking changes
- **Home dashboard layout is unrecognisable.** If you relied on the old 4 KPI cards / 2-column body, this release will look very different. All that data is still in `data.ts` and rendered in `Tasks` / `Trackers`.
- **Calendar right side panel removed.** Important Dates and Today Note cards are gone from the calendar — that information now lives inside the day cells (holiday banners + event dots) or in the underlying Markdown files.

## Upgrade
Replace `main.js`, `styles.css`, and `manifest.json` in your plugin folder, then reload Obsidian.

To opt into the new event feed, edit your `Daily Notes/YYYY-MM-DD.md` and add a `## ⏰ Schedule` table; the rows appear in that day's calendar cell on next render. To set today's #1 task, add `topTask: "..."` to the same file's frontmatter.

---

# Bloom v0.1.1 — Release Notes

**Released:** 2026-08-17
**Tag:** `v0.1.1`
**Status:** First public open-source release

## What's in this release
- Four views: Dashboard, Tasks (board), Calendar, Trackers.
- 8-item sidebar navigation with active-state highlighting.
- Light / Dark theme toggle (pastel-fresh tokens).
- Live data reading from the vault's Markdown notes (tasks, projects, trackers, calendar, library) with safe static fallback.
- Standalone `prototype.html` preview that reuses the same render layer as the plugin.

## Changes since 0.1.0
- Lowered `minAppVersion` to `0.15.0` for broader compatibility.
- Replaced the ribbon icon with a guaranteed built-in Obsidian icon (`layout-dashboard`).
- Added `onload`/render error handling with a user-facing `Notice` and `[Bloom]` console logs for easier debugging.
- Fixed the plugin/view not appearing when the ribbon icon name was unrecognized.

## Known limitations (honest notes)
- **Read-only for now:** checking a task or adding a task does not yet write back to your notes. (Planned for 0.2.0.)
- Demo data reflects the original vault's initial state (e.g., one book logged, some project titles are placeholders). With your real notes, Bloom populates automatically.
- Layout is optimised for desktop widths; mobile is supported but not yet tuned.

## Upgrade
Replace `main.js`, `styles.css`, and `manifest.json` in your plugin folder, then reload Obsidian.