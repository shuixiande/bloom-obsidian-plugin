/* =========================================================================
   Bloom — standalone browser prototype bootstrap
   Reuses the exact same render layer (dashboard.ts + data.ts) as the Obsidian
   plugin, so the prototype can never drift from the design again.
   Bundled to prototype.js by esbuild (iife, no external deps).
   ========================================================================= */
import {
  buildShell,
  showView,
  setCalendarMonth,
  newCalNav,
  shiftCalendarMonth,
} from "./dashboard";
import type { CalNav } from "./dashboard";
import { loadBloomData } from "./data";
import type { BloomData } from "./data";

/** Parse trusted, self-generated markup without assigning to innerHTML. */
function fromHtml(html: string): DocumentFragment {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const frag = document.createDocumentFragment();
  while (doc.body.firstChild) frag.appendChild(doc.body.firstChild);
  return frag;
}

const app = document.getElementById("app");
if (app) {
  let calNav: CalNav = { year: 2026, monthIndex: 7 };
  let lastData: BloomData | null = null;

  function paint(view: string = "home") {
    const data = loadBloomData();
    lastData = data;
    calNav = newCalNav(data);
    app!.replaceChildren(fromHtml(buildShell(data, new Date(), view)));
    wire();
    applyTheme(dark);
  }

  /** Tiny inline prompt (browsers block nothing here, but we keep parity with
   * the plugin's native-modal flow instead of window.prompt). */
  function askTaskName(onSubmit: (name: string) => void) {
    document.querySelector(".proto-ask")?.remove();
    const overlay = document.createElement("div");
    overlay.className = "proto-ask";
    const box = document.createElement("div");
    box.className = "proto-ask-box";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "New task name";
    const ok = document.createElement("button");
    ok.textContent = "Add";
    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    box.append(input, ok, cancel);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    input.focus();

    const close = () => overlay.remove();
    const submit = () => {
      const v = input.value.trim();
      close();
      if (v) onSubmit(v);
    };
    ok.addEventListener("click", submit);
    cancel.addEventListener("click", close);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") submit();
      if (ev.key === "Escape") close();
    });
  }

  function addTodoCard(name: string) {
    if (!lastData) return;
    lastData.tasks.todo.push({ name, category: "Daily", color: "#b5627c" });
    const todoBody = app!.querySelector<HTMLElement>('.board-col[data-col="todo"] .board-col-body');
    if (todoBody) {
      const card = document.createElement("div");
      card.className = "t-card";
      const tag = document.createElement("span");
      tag.className = "t-tag t-tag-daily";
      tag.textContent = "Daily";
      const label = document.createElement("div");
      label.className = "t-name";
      label.textContent = name;
      card.append(tag, label);
      todoBody.appendChild(card);
    }
    const todoCol = app!.querySelector<HTMLElement>('.board-col[data-col="todo"]');
    const todoCount = todoCol?.querySelector(".board-col-body")?.children.length ?? 0;
    todoCol?.querySelector(".col-count")?.replaceChildren(document.createTextNode(String(todoCount)));
  }

  function wire() {
    app!.querySelectorAll<HTMLElement>(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => showView(app!, btn.dataset.nav!));
    });

    const toggle = app!.querySelector<HTMLElement>("#theme-toggle");
    toggle?.addEventListener("click", () => {
      dark = !dark;
      applyTheme(dark);
    });

    const search = app!.querySelector<HTMLInputElement>(".search-box input");
    search?.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      const tasksView = app!.querySelector<HTMLElement>('.view[data-view="tasks"]');
      tasksView?.querySelectorAll<HTMLElement>(".t-card").forEach((card) => {
        const name = card.querySelector(".t-name")?.textContent?.toLowerCase() ?? "";
        card.style.display = !q || name.includes(q) ? "" : "none";
      });
    });

    const newTask = app!.querySelector<HTMLElement>("#new-task-btn");
    newTask?.addEventListener("click", () => askTaskName((name) => addTodoCard(name)));

    const topCheck = app!.querySelector<HTMLElement>("#top-task-check");
    topCheck?.addEventListener("click", () => {
      const card = app!.querySelector<HTMLElement>(".top-task-card");
      if (!card) return;
      const done = card.classList.toggle("is-done");
      topCheck.classList.toggle("on", done);
    });

    app!.querySelectorAll<HTMLElement>("[data-cal-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = parseInt(btn.getAttribute("data-cal-nav") || "0", 10);
        if (!dir || !lastData) return;
        calNav = shiftCalendarMonth(calNav, dir);
        setCalendarMonth(app!, lastData, calNav);
      });
    });
    const todayBtn = app!.querySelector<HTMLElement>("#cal-today-btn");
    todayBtn?.addEventListener("click", () => {
      if (!lastData) return;
      calNav = newCalNav(lastData);
      setCalendarMonth(app!, lastData, calNav);
    });
  }

  // Theme persistence for the demo page (per browser tab).
  let dark = sessionStorage.getItem("bloom-dark") === "1";
  const root = app.querySelector<HTMLElement>(".bloom");
  function applyTheme(d: boolean) {
    root?.classList.toggle("theme-dark", d);
    sessionStorage.setItem("bloom-dark", d ? "1" : "0");
  }

  paint("home");
}
