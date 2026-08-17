/* =========================================================================
   Bloom — Obsidian plugin entry
   Mounts the dashboard, wires nav + theme toggle, persists theme preference.
   styles.css at the plugin root is auto-loaded by Obsidian.
   ========================================================================= */
import { ItemView, WorkspaceLeaf, Plugin, Notice } from "obsidian";
import { buildShell, showView } from "./dashboard";
import { loadBloomDataLive } from "./vault";

export const VIEW_TYPE_BLOOM = "bloom-view";

interface BloomSettings {
  dark: boolean;
}

const DEFAULT_SETTINGS: BloomSettings = { dark: false };

export class BloomView extends ItemView {
  private currentView = "home";
  private dark = false;
  private settings: BloomSettings;

  constructor(leaf: WorkspaceLeaf, settings: BloomSettings) {
    super(leaf);
    this.settings = settings;
    this.dark = settings.dark;
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

  private async render() {
    this.containerEl.empty();
    const wrap = this.containerEl.createDiv();
    try {
      const data = await loadBloomDataLive(this.app).catch((e) => {
        console.error("[Bloom] live data failed, using static fallback:", e);
        return loadBloomData();
      });
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
  }

  private filterTasks(q: string) {
    const tasksView = this.containerEl.querySelector<HTMLElement>('.view[data-view="tasks"]');
    if (!tasksView) return;
    tasksView.querySelectorAll<HTMLElement>(".t-card").forEach((card) => {
      const name = card.querySelector(".t-name")?.textContent?.toLowerCase() ?? "";
      card.style.display = !q || name.includes(q) ? "" : "none";
    });
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
}
