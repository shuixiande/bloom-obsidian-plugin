/* =========================================================================
   Bloom — Obsidian plugin entry
   Mounts the dashboard, wires nav + theme toggle + real interactions
   (new task, checkbox write-back, calendar month navigation), and persists
   the theme preference. styles.css at the plugin root is auto-loaded.
   ========================================================================= */
import { ItemView, WorkspaceLeaf, Plugin, Notice } from "obsidian";
import { buildShell, showView, setCalendarMonth } from "./dashboard";
import { loadBloomDataLive } from "./vault";
import { loadBloomData } from "./data";
import type { BloomData } from "./data";
import { BloomSettingsModal } from "./settings";

export const VIEW_TYPE_BLOOM = "bloom-view";

interface BloomSettings {
  dark: boolean;
  defaultView?: string; // one of: home | tasks | calendar | trackers
}

const DEFAULT_SETTINGS: BloomSettings = { dark: false, defaultView: "home" };

const TODO_FILE = "11-Todo/Daily Tasks.md";

/** Minimal HTML escape for user-supplied task names. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

export class BloomView extends ItemView {
  private currentView = "home";
  private dark = false;
  private settings: BloomSettings;
  private lastData: BloomData | null = null;
  private calY = 2026;
  private calM = 7;

  constructor(leaf: WorkspaceLeaf, settings: BloomSettings) {
    super(leaf);
    this.settings = settings;
    this.dark = settings.dark;
    this.currentView = settings.defaultView || "home";
  }

  getViewType() {
    return VIEW_TYPE_BLOOM;
  }
  getDisplayText() {
    return "Bloom";
  }
  getIcon() {
    return "layout-dashboard";
  }

  async onOpen() {
    this.render();
  }
  async onClose() {
    this.containerEl.empty();
  }

  setExternalView(id: string) {
    this.currentView = id;
    this.showView(id);
  }
  setExternalTheme(dark: boolean) {
    this.dark = dark;
    this.settings.dark = dark;
    this.applyTheme();
  }

  /** Re-read live vault data and rebuild the view. */
  reload() {
    this.render();
  }

  private async render() {
    this.containerEl.empty();
    const wrap = this.containerEl.createDiv();
    try {
      const data = await loadBloomDataLive(this.app).catch((e) => {
        console.error("[Bloom] live data failed, using static fallback:", e);
        return loadBloomData();
      });
      this.lastData = data;
      this.calY = data.calendar.year;
      this.calM = data.calendar.monthIndex;
      wrap.innerHTML = buildShell(data, new Date(), this.currentView);
      this.wire(wrap);
      this.applyTheme();
    } catch (e) {
      console.error("[Bloom] render failed:", e);
      wrap.innerHTML =
        '<div style="padding:24px;color:#b5627c">Bloom failed to render — see DevTools console.</div>';
    }
  }

  private applyTheme() {
    const root = this.containerEl.querySelector(".bloom");
    if (root) root.toggleClass("theme-dark", this.dark);
  }

  private showView(id: string) {
    showView(this.containerEl, id);
  }

  private wire(root: HTMLElement) {
    root.querySelectorAll<HTMLElement>(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.nav!;
        this.currentView = id;
        this.showView(id);
      });
    });

    root.querySelectorAll<HTMLElement>(".search-box input").forEach((inp) => {
      inp.addEventListener("input", () => this.filterTasks(inp.value.trim().toLowerCase()));
    });

    const toggle = root.querySelector<HTMLElement>("#theme-toggle");
    toggle?.addEventListener("click", () => {
      this.dark = !this.dark;
      this.settings.dark = this.dark;
      (this.plugin as BloomPlugin).saveSettings();
      this.applyTheme();
    });

    // "+ New task" → append to Daily Tasks.md and update the board live
    const newTask = root.querySelector<HTMLElement>("#new-task-btn");
    newTask?.addEventListener("click", () => this.addTask());

    // Settings → open the settings modal
    const settingsBtn = root.querySelector<HTMLElement>("#settings-btn");
    settingsBtn?.addEventListener("click", () => {
      new BloomSettingsModal(this.app, this.plugin).open();
    });

    // Today's Tasks checkboxes → toggle visual + write back to source file
    root.querySelectorAll<HTMLElement>(".chk-row").forEach((row) => {
      row.addEventListener("click", () => this.toggleTask(row));
    });

    // Calendar month navigation
    root.querySelectorAll<HTMLElement>(".cal-arrow").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = (btn.getAttribute("aria-label") || "").includes("Previous") ? -1 : 1;
        let m = this.calM + dir;
        let y = this.calY;
        if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
        if (y < 2026 || y > 2035) return;
        this.calY = y;
        this.calM = m;
        if (this.lastData) setCalendarMonth(this.containerEl, this.lastData, y, m);
      });
    });
  }

  private filterTasks(q: string) {
    const tasksView = this.containerEl.querySelector<HTMLElement>('.view[data-view="tasks"]');
    if (!tasksView) return;
    tasksView.querySelectorAll<HTMLElement>(".t-card").forEach((card) => {
      const name = card.querySelector(".t-name")?.textContent?.toLowerCase() ?? "";
      card.style.display = !q || name.includes(q) ? "" : "none";
    });
  }

  private async addTask() {
    const name = window.prompt("New task name:");
    if (!name || !name.trim()) return;
    const task = name.trim();
    try {
      const content = await this.app.vault.adapter.read(TODO_FILE);
      const appended = content.replace(/\s*$/, "") + "\n- [ ] " + task + "\n";
      await this.app.vault.adapter.write(TODO_FILE, appended);
    } catch (e) {
      console.error("[Bloom] addTask write failed:", e);
      new Notice("Bloom: could not save new task");
      return;
    }
    // insert card into the To Do column
    const todoBody = this.containerEl.querySelector<HTMLElement>('.board-col[data-col="todo"] .board-col-body');
    if (todoBody) {
      const card = document.createElement("div");
      card.className = "t-card";
      card.innerHTML = `<span class="t-tag" style="color:#b5627c">Daily</span><div class="t-name">${esc(task)}</div>`;
      todoBody.appendChild(card);
    }
    // bump To Do count + board subtitle
    const todoCol = this.containerEl.querySelector<HTMLElement>('.board-col[data-col="todo"]');
    const todoCount = todoCol?.querySelector(".board-col-body")?.children.length ?? 0;
    todoCol?.querySelector(".col-count")?.replaceChildren(document.createTextNode(String(todoCount)));
    this.refreshBoardSub();
    // also surface it in the Today's Tasks list on the Dashboard
    const chkList = this.containerEl.querySelector<HTMLElement>('.view[data-view="home"] .chk-list');
    if (chkList) {
      const row = document.createElement("div");
      row.className = "chk-row";
      row.innerHTML = `<span class="chk"></span><span class="chk-name">${esc(task)}</span>`;
      chkList.appendChild(row);
      this.refreshTodayPill();
    }
    new Notice("Bloom: task added to Daily Tasks");
  }

  private async toggleTask(row: HTMLElement) {
    const file = row.dataset.file;
    const name = row.querySelector(".chk-name")?.textContent ?? "";
    const nowDone = !row.classList.contains("done");
    row.classList.toggle("done", nowDone);
    row.querySelector(".chk")?.classList.toggle("on", nowDone);
    if (file && this.app && name) {
      try {
        const content = await this.app.vault.adapter.read(file);
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (/^\s*-\s*\[[ xX]\]\s*/.test(lines[i]) && lines[i].includes(name)) {
            lines[i] = lines[i].replace(/\[[ xX]\]/, `[${nowDone ? "x" : " "}]`);
            break;
          }
        }
        await this.app.vault.adapter.write(file, lines.join("\n"));
      } catch (e) {
        console.error("[Bloom] toggle write failed:", e);
        new Notice("Bloom: could not save task state");
      }
    }
    this.refreshTodayPill();
  }

  private refreshBoardSub() {
    const sub = this.containerEl.querySelector<HTMLElement>(".board-sub");
    if (!sub) return;
    const num = (sel: string) => parseInt(this.containerEl.querySelector<HTMLElement>(sel)?.textContent ?? "0") || 0;
    const open = num('.board-col[data-col="todo"] .col-count') + num('.board-col[data-col="doing"] .col-count');
    const done = num('.board-col[data-col="done"] .col-count');
    sub.textContent = `${open} open · ${done} done today`;
  }

  private refreshTodayPill() {
    const pill = this.containerEl.querySelector<HTMLElement>('.view[data-view="home"] .pill');
    if (!pill) return;
    const rows = this.containerEl.querySelectorAll('.view[data-view="home"] .chk-row');
    let done = 0;
    rows.forEach((r) => {
      if (r.classList.contains("done")) done++;
    });
    pill.textContent = `${done}/${rows.length}`;
  }

  // back-reference set by the plugin
  plugin!: BloomPlugin;
}

export default class BloomPlugin extends Plugin {
  settings: BloomSettings = DEFAULT_SETTINGS;
  private view: BloomView | null = null;

  async onload() {
    try {
      console.log("[Bloom] onload start");
      await this.loadSettings();

      this.registerView(VIEW_TYPE_BLOOM, (leaf) => {
        const v = new BloomView(leaf, this.settings);
        v.plugin = this;
        this.view = v;
        return v;
      });

      this.addRibbonIcon("layout-dashboard", "Open Bloom", () => this.activateView());

      this.addCommand({
        id: "open-bloom",
        name: "Open Bloom dashboard",
        callback: () => this.activateView(),
      });
      this.addCommand({
        id: "toggle-bloom-theme",
        name: "Toggle light / dark theme",
        callback: () => {
          const next = !this.settings.dark;
          this.settings.dark = next;
          this.view?.setExternalTheme(next);
          this.saveSettings();
        },
      });

      new Notice("Bloom dashboard ready — click the dashboard icon in the left ribbon.");
      console.log("[Bloom] onload complete");
    } catch (e) {
      console.error("[Bloom] onload failed:", e);
      new Notice("Bloom failed to load: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_BLOOM);
    if (existing.length) {
      leaf = existing[0];
    } else {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE_BLOOM, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }

  /** Called by the settings modal: persist + apply theme live. */
  applyThemeExternal(dark: boolean) {
    this.settings.dark = dark;
    this.view?.setExternalTheme(dark);
    this.saveSettings();
  }
  /** Called by the settings modal: re-read live vault data. */
  reloadView() {
    this.view?.reload();
  }
  /** Called by the settings modal: persist + switch the landing view. */
  setDefaultView(id: string) {
    this.settings.defaultView = id;
    this.view?.setExternalView(id);
    this.saveSettings();
  }
}
