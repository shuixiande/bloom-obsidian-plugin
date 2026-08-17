/* =========================================================================
   Bloom — Settings modal
   Opened from the header "Settings" button. Lets the user pick the default
   landing view, switch the theme (applied live), and refresh the live vault
   data. Settings persist via Plugin.saveData; the panel reuses the dashboard's
   pastel tokens by wrapping itself in a `.bloom` element.
   ========================================================================= */
import { App, Modal, Notice } from "obsidian";
import type BloomPlugin from "./main";

const VIEWS = [
  { id: "home", label: "Dashboard" },
  { id: "tasks", label: "Tasks" },
  { id: "calendar", label: "Calendar" },
  { id: "trackers", label: "Trackers" },
];

const DATA_SOURCES = [
  "11-Todo/Daily Tasks.md",
  "11-Todo/Study Tasks.md",
  "11-Todo/Project Tasks.md",
  "10-Projects/Project Dashboard.md",
  "13-Trackers/Weight Tracker.md",
  "13-Trackers/Period Tracker.md",
  "13-Trackers/Expense Tracker.md",
  "12-Calendar/Monthly Calendar.md",
  "12-Calendar/Daily Notes/<date>.md",
];

export class BloomSettingsModal extends Modal {
  constructor(app: App, private plugin: BloomPlugin) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const wrap = contentEl.createDiv({ cls: "bloom bloom-settings" });
    if (this.plugin.settings.dark) wrap.addClass("theme-dark");
    const s = this.plugin.settings;

    wrap.createEl("h3", { text: "Bloom settings", cls: "bs-title" });

    /* ---- Default view ---- */
    const vRow = wrap.createDiv({ cls: "bs-row" });
    vRow.createSpan({ text: "Default view", cls: "bs-label" });
    const vSeg = vRow.createDiv({ cls: "bs-seg" });
    VIEWS.forEach((v) => {
      const b = vSeg.createEl("button", { text: v.label, cls: "bs-seg-btn" });
      if ((s.defaultView || "home") === v.id) b.addClass("active");
      b.addEventListener("click", () => {
        vSeg.querySelectorAll(".bs-seg-btn").forEach((x) => x.removeClass("active"));
        b.addClass("active");
        this.plugin.setDefaultView(v.id);
      });
    });

    /* ---- Theme ---- */
    const tRow = wrap.createDiv({ cls: "bs-row" });
    tRow.createSpan({ text: "Theme", cls: "bs-label" });
    const tSeg = tRow.createDiv({ cls: "bs-seg" });
    ([
      ["light", "Light"],
      ["dark", "Dark"],
    ] as [string, string][]).forEach(([val, lbl]) => {
      const b = tSeg.createEl("button", { text: lbl, cls: "bs-seg-btn" });
      if (s.dark === (val === "dark")) b.addClass("active");
      b.addEventListener("click", () => {
        tSeg.querySelectorAll(".bs-seg-btn").forEach((x) => x.removeClass("active"));
        b.addClass("active");
        this.plugin.applyThemeExternal(val === "dark");
      });
    });

    /* ---- Data actions ---- */
    const dRow = wrap.createDiv({ cls: "bs-row" });
    dRow.createSpan({ text: "Data", cls: "bs-label" });
    const refresh = dRow.createEl("button", { text: "↻ Refresh from vault", cls: "bs-btn" });
    refresh.addEventListener("click", () => {
      this.plugin.reloadView();
      new Notice("Bloom: data refreshed");
    });

    /* ---- Data sources (read-only) ---- */
    wrap.createEl("div", { text: "Reads from these vault files:", cls: "bs-note" });
    const list = wrap.createEl("div", { cls: "bs-src" });
    DATA_SOURCES.forEach((p) => list.createEl("code", { text: p, cls: "bs-src-item" }));

    /* ---- Footer ---- */
    const foot = wrap.createDiv({ cls: "bs-row bs-foot" });
    const done = foot.createEl("button", { text: "Done", cls: "bs-btn bs-primary" });
    done.addEventListener("click", () => this.close());
  }

  onClose() {
    this.contentEl.empty();
  }
}
