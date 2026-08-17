# Setting up the Bloom Obsidian Vault

This guide explains how to recreate the vault structure that Bloom expects, so you (or a friend) can run the dashboard on your own notes.

## 1. Create the vault
- In Obsidian, create a new vault (or use an existing one).
- Enable **Community plugins** (*Settings → Community plugins → turn on*).

## 2. Recommended folder structure
Bloom reads these paths. You can use the exact names below, or adapt `src/vault.ts` to your own layout.

```
<vault>/
  00-Dashboard.md
  01-Quick Capture.md
  10-Projects/Project Dashboard.md
  11-Todo/Daily Tasks.md
  11-Todo/Study Tasks.md
  11-Todo/Project Tasks.md
  12-Calendar/Monthly Calendar.md
  12-Calendar/Daily Notes/<YYYY-MM-DD>.md
  13-Trackers/Weight Tracker.md
  13-Trackers/Period Tracker.md
  13-Trackers/Expense Tracker.md
  14-Learning/README.md
  15-Books/Book List.md
  .obsidian/plugins/bloom/{main.js,styles.css,manifest.json}
```

## 3. Note formats Bloom understands
- **Tasks** — standard checkboxes anywhere in `11-Todo/*.md`:
  `- [ ] Cook dinner` / `- [x] Clean litter box`
- **Projects** — in `10-Projects/Project Dashboard.md`:
  `### 1. Redesign portfolio` followed by `<progress value="60" max="100">60%</progress>`
- **Trackers** — Markdown tables in `13-Trackers/*.md` (Weight / Period / Expense). The latest row is treated as "current".
- **Daily notes** — `12-Calendar/Daily Notes/YYYY-MM-DD.md` with frontmatter `weight`, `mood`, and an `Expenses` table.
- **Calendar** — `12-Calendar/Monthly Calendar.md` with an "Important Dates" table.

## 4. Install Bloom
See [README.md → Installation](../README.md#installation). Copy the three build artifacts into `.obsidian/plugins/bloom/`, enable the plugin, and reload.

## 5. (Optional) Companion plugins
The original vault also uses **Dataview** and **Templater** for auto-generated lists and templates. Bloom itself does **not** require them — it parses raw Markdown directly. Install them only if you want the full XY153 experience.

## 6. Keep it in Git (optional)
The vault itself can be a git repo. Add `.obsidian/` to `.gitignore` (or only ignore `*.json` inside it) so local plugin state stays private, and keep the `bloom-obsidian-plugin` source in its own repository (this one).
