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
