/* =========================================================================
   Bloom — standalone browser prototype bootstrap
   Reuses the exact same render layer (dashboard.ts + data.ts) as the Obsidian
   plugin, so the prototype can never drift from the design again.
   Bundled to prototype.js by esbuild (iife, no external deps).
   ========================================================================= */
import { buildShell, showView } from "./dashboard";
import { loadBloomData } from "./data";

const app = document.getElementById("app");
if (app) {
  app.innerHTML = buildShell(loadBloomData(), new Date(), "home");

  let dark = localStorage.getItem("bloom-dark") === "1";
  const root = app.querySelector<HTMLElement>(".bloom");
  function applyTheme(d: boolean) {
    root?.classList.toggle("theme-dark", d);
    localStorage.setItem("bloom-dark", d ? "1" : "0");
  }
  applyTheme(dark);

  app.querySelectorAll<HTMLElement>(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => showView(app, btn.dataset.nav!));
  });

  const toggle = app.querySelector<HTMLElement>("#theme-toggle");
  toggle?.addEventListener("click", () => {
    dark = !dark;
    applyTheme(dark);
  });

  const search = app.querySelector<HTMLInputElement>(".search-box input");
  search?.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    const tasksView = app.querySelector<HTMLElement>('.view[data-view="tasks"]');
    tasksView?.querySelectorAll<HTMLElement>(".t-card").forEach((card) => {
      const name = card.querySelector(".t-name")?.textContent?.toLowerCase() ?? "";
      card.style.display = !q || name.includes(q) ? "" : "none";
    });
  });
}
