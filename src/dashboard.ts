/* =========================================================================
   Bloom — view rendering (single source of truth)
   Pure HTML builders. No Obsidian imports so the same markup is reused by the
   standalone prototype (prototype.ts). Event wiring lives in main.ts /
   prototype.ts.
   ========================================================================= */
import type { BloomData, Task, ExpenseCategory, CalEvent, DayMeta } from "./data";

export const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/></svg>`,
  today: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/></svg>`,
  tasks: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.6"/><path d="M13 4.5h8M13 8.5h6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><path d="M13 15.5h8M13 19.5h6"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>`,
  trackers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l3-4 3 3 5-7"/></svg>`,
  learning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.4-5-1.4-7 0v11c2-1.4 5-1.4 7 0 2-1.4 5-1.4 7 0V6c-2-1.4-5-1.4-7 0z"/><path d="M12 6v11"/></svg>`,
  books: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h7v13H4zM13 5h7v13h-7z"/></svg>`,
  projects: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h3l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0-1.2-2.9 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9 2 2 0 1 1 2.8-2.8 1.7 1.7 0 0 0 1.9-.3 1.7 1.7 0 0 0 1.2-2.9 2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2 2 2 0 1 1 2.8 2.8 1.7 1.7 0 0 0-.3 1.9z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  chevL: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`,
  chevR: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-11"/></svg>`,
};

const NAV = [
  { id: "home", label: "Home", icon: ICONS.home },
  { id: "today", label: "Today", icon: ICONS.today },
  { id: "tasks", label: "Tasks", icon: ICONS.tasks },
  { id: "calendar", label: "Calendar", icon: ICONS.calendar },
  { id: "trackers", label: "Trackers", icon: ICONS.trackers },
  { id: "learning", label: "Learning", icon: ICONS.learning },
  { id: "books", label: "Books", icon: ICONS.books },
  { id: "projects", label: "Projects", icon: ICONS.projects },
];

const HEADER: Record<string, { eyebrow: string; name: string }> = {
  home: { eyebrow: "Good evening,", name: "Candice" },
  today: { eyebrow: "Today", name: "Candice" },
  tasks: { eyebrow: "Your tasks", name: "Candice" },
  calendar: { eyebrow: "Good evening,", name: "Candice" },
  trackers: { eyebrow: "Health & habits", name: "Trackers" },
  learning: { eyebrow: "Your library", name: "Learning" },
  books: { eyebrow: "Your shelf", name: "Books" },
  projects: { eyebrow: "In progress", name: "Projects" },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "HH:MM" -> sortable number; "8pm" -> 20*60; anything else -> 25*60 (end of day). */
function timeToMin(t?: string): number {
  if (!t) return 25 * 60;
  const ampm = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = ampm[2] ? parseInt(ampm[2], 10) : 0;
    if (/pm/i.test(ampm[3]) && h < 12) h += 12;
    if (/am/i.test(ampm[3]) && h === 12) h = 0;
    return h * 60 + m;
  }
  const h24 = t.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (h24) return parseInt(h24[1], 10) * 60 + (h24[2] ? parseInt(h24[2], 10) : 0);
  return 25 * 60;
}

function bloomMark(): string {
  return `<svg class="bloom-mark" viewBox="0 0 32 32" role="img" aria-label="Bloom">
    <defs><linearGradient id="bm-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2a0b5"/><stop offset="1" stop-color="#e8935f"/>
    </linearGradient></defs>
    <rect width="32" height="32" rx="9" fill="url(#bm-bg)"/>
    <g fill="#ffffff">
      <circle cx="16" cy="8.5" r="3.1"/><circle cx="23.5" cy="16" r="3.1"/>
      <circle cx="16" cy="23.5" r="3.1"/><circle cx="8.5" cy="16" r="3.1"/>
    </g>
    <circle cx="16" cy="16" r="3.6" fill="#d9a441"/>
  </svg>`;
}

/* ------------------------------- TASKS ----------------------------------- */
function taskCard(t: Task): string {
  const bar =
    t.progress != null
      ? `<div class="t-bar"><div class="t-bar-fill" style="width:${t.progress}%"></div></div>
         <div class="t-prog">${t.progress}%</div>`
      : "";
  return `<div class="t-card">
    <span class="t-tag" style="color:${t.color}">${t.category}</span>
    <div class="t-name">${t.name}</div>
    ${bar}
  </div>`;
}

const BOARD_COLS = [
  { key: "todo", title: "To Do", dot: "var(--c-pink)", tint: "#faf2ef", countBg: "#fdeef2", countFg: "#b5627c" },
  { key: "doing", title: "In Progress", dot: "var(--c-peach)", tint: "#fdf2e8", countBg: "#fdf2e8", countFg: "#c07a3f" },
  { key: "done", title: "Done", dot: "var(--c-sage)", tint: "#f0f7ee", countBg: "#eaf4ea", countFg: "#4f7a3a" },
] as const;

function tasksView(d: BloomData): string {
  const open = d.tasks.todo.length + d.tasks.doing.length;
  const cols = BOARD_COLS.map((c) => {
    const list = d.tasks[c.key as "todo" | "doing" | "done"].map(taskCard).join("");
    const count = d.tasks[c.key as "todo" | "doing" | "done"].length;
    return `<div class="board-col" style="--tint:${c.tint}" data-col="${c.key}">
      <div class="board-col-head">
        <span class="col-dot" style="background:${c.dot}"></span>
        <span class="col-title">${c.title}</span>
        <span class="col-count" style="background:${c.countBg};color:${c.countFg}">${count}</span>
      </div>
      <div class="board-col-body">${list}</div>
    </div>`;
  }).join("");
  return `<section class="view hidden" data-view="tasks">
    <div class="board-head">
      <div><div class="board-title">Task Board</div>
        <div class="board-sub">${open} open · ${d.tasks.done.length} done today</div></div>
      <button class="btn-primary" id="new-task-btn">+ New task</button>
    </div>
    <div class="board">${cols}</div>
  </section>`;
}

/* ------------------------------ DASHBOARD -------------------------------- */
/** Ultra-minimal "single thread" home: greeting + one big top task card. */
function homeView(d: BloomData): string {
  const t = d.topTask;
  const card = t
    ? `<div class="top-task-card ${t.done ? "is-done" : ""}" data-file="${t.file ?? ""}">
        <div class="ttc-eyebrow">TODAY'S #1</div>
        <button class="ttc-check ${t.done ? "on" : ""}" id="top-task-check" aria-label="Mark done">
          ${ICONS.check}
        </button>
        <div class="ttc-title">${t.title}</div>
        ${t.description ? `<div class="ttc-desc">${t.description}</div>` : ""}
        <div class="ttc-foot">
          <span class="ttc-source">${t.file ? `📝 ${t.file.split("/").pop()}` : ""}</span>
          <span class="ttc-more">${d.moreTasksToday > 0 ? `${d.moreTasksToday} more tasks today →` : "All caught up"}</span>
        </div>
      </div>`
    : `<div class="top-task-card placeholder">
        <div class="ttc-eyebrow">TODAY'S #1</div>
        <div class="ttc-title muted">No top task set today</div>
        <div class="ttc-desc">Add <code>topTask: "..."</code> to today's Daily Note frontmatter.</div>
      </div>`;

  return `<section class="view" data-view="home">
    <div class="home-wrap">
      ${card}
    </div>
  </section>`;
}

/* ------------------------------ CALENDAR -------------------------------- */
const MAX_EVENTS_IN_CELL = 4;

function eventRow(e: CalEvent): string {
  const dot = `<span class="cal-ev-dot" style="background:${e.color ?? "#7d8cc4"}"></span>`;
  const time = e.time ? `<span class="cal-ev-time">${e.time}</span>` : "";
  return `<div class="cal-ev ${e.kind}">
    ${dot}${time}<span class="cal-ev-label">${e.label}</span>
  </div>`;
}

function holidayBanner(e: CalEvent): string {
  return `<div class="cal-holiday" style="background:#b87b5a">${e.label}</div>`;
}

/** Render a single day cell, used by both initial paint and month-nav. */
export function calCellHtml(
  day: DayMeta | undefined,
  isToday: boolean,
  weekend: boolean
): string {
  if (!day) return `<div class="cal-cell empty"></div>`;
  const cls = [
    "cal-cell",
    isToday ? "today" : "",
    weekend ? "weekend" : "",
    day.events.length ? "has-events" : "",
  ].filter(Boolean).join(" ");
  // Holiday banner (first event of kind === "holiday")
  const holiday = day.events.find((e) => e.kind === "holiday");
  const banner = holiday ? holidayBanner(holiday) : "";
  const otherEvents = day.events.filter((e) => e.kind !== "holiday");
  const sorted = [...otherEvents].sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
  const shown = sorted.slice(0, MAX_EVENTS_IN_CELL);
  const overflow = sorted.length - shown.length;
  const overflowHtml = overflow > 0 ? `<div class="cal-ev-more">+${overflow} more</div>` : "";
  return `<div class="${cls}">
    <div class="cal-head">
      <span class="cal-day">${day.day}</span>
      ${day.lunarLabel ? `<span class="cal-lunar">(${day.lunarLabel})</span>` : ""}
    </div>
    ${banner}
    <div class="cal-events">${shown.map(eventRow).join("")}${overflowHtml}</div>
  </div>`;
}

function calendarGridHtml(
  year: number,
  monthIndex: number,
  daysInMonth: number,
  today: number,
  isCurrentMonth: boolean,
  monthEvents: DayMeta[]
): string {
  const lead = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // Monday-start blanks
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let cells = "";
  for (let i = 0; i < lead; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let day = 1; day <= daysInMonth; day++) {
    const jsDow = new Date(year, monthIndex, day).getDay(); // 0=Sun..6=Sat
    const weekend = jsDow === 0 || jsDow === 6;
    const isToday = isCurrentMonth && day === today;
    const dayMeta = monthEvents[day - 1];
    cells += calCellHtml(dayMeta, isToday, weekend);
  }
  return dow.map((x) => `<div class="cal-dow">${x}</div>`).join("") + cells;
}

function calendarView(d: BloomData): string {
  const c = d.calendar;
  const grid = calendarGridHtml(c.year, c.monthIndex, c.daysInMonth, c.today, true, d.monthEvents);
  return `<section class="view hidden" data-view="calendar">
    <div class="cal-wrap">
      <div class="cal-main card">
        <div class="cal-top">
          <button class="cal-today-btn" id="cal-today-btn" title="Jump to today">Today</button>
          <button class="cal-arrow" data-cal-nav="-1" aria-label="Previous month">${ICONS.chevL}</button>
          <button class="cal-arrow" data-cal-nav="1" aria-label="Next month">${ICONS.chevR}</button>
          <div class="cal-title">${c.monthLabel}</div>
          <div class="cal-lunar-title" id="cal-lunar-title"></div>
        </div>
        <div class="cal-grid" id="cal-grid">${grid}</div>
      </div>
    </div>
  </section>`;
}

/* ------------------------------ TRACKERS -------------------------------- */
function weightChart(d: BloomData): string {
  const w = d.trackers.weight;
  const pts = w.points;
  if (pts.length === 1) {
    return `<svg class="chart" viewBox="0 0 464 150" preserveAspectRatio="none" role="img" aria-label="Weight trend">
      <line class="grid-line" x1="34" y1="35" x2="448" y2="35"/>
      <line class="grid-line" x1="34" y1="80" x2="448" y2="80"/>
      <line class="grid-line" x1="34" y1="125" x2="448" y2="125"/>
      <line class="axis" x1="34" y1="140" x2="448" y2="140"/>
      <circle class="pt" cx="232" cy="80" r="6"/>
      <text class="pt-label" x="232" y="62" text-anchor="middle">${pts[0].toFixed(1)}</text>
      <text class="axis-label" x="232" y="150" text-anchor="middle">${w.labels[0]}</text>
    </svg>`;
  }
  return `<svg class="chart" viewBox="0 0 464 150" preserveAspectRatio="none"><line class="axis" x1="34" y1="140" x2="448" y2="140"/></svg>`;
}

function donut(cats: ExpenseCategory[], total: number, month: string): string {
  const seg = cats
    .map((c) => `<div class="legend-row"><span class="swatch" style="background:${c.color}"></span>${c.name} · ¥${c.amount.toFixed(2)} · ${c.pct}%</div>`)
    .join("");
  return `<div class="chart-row">
    <div class="donut"><div class="donut-center"><b>¥${total.toFixed(0)}</b><span>${month.split(" ")[0]}</span></div></div>
    <div class="legend">${seg}</div>
  </div>`;
}

function trackersView(d: BloomData): string {
  const w = d.trackers.weight;
  const p = d.trackers.period;
  const e = d.trackers.expense;
  const cyclePct = ((p.dayOfCycle / p.cycleDays) * 100).toFixed(1);
  const ms = d.trackers.month;
  return `<section class="view hidden" data-view="trackers">
    <div class="dash-grid">
      <div class="dash-left">
        <div class="card">
          <div class="card-head">
            <div><div class="t-title">Weight Trend</div><div class="t-sub">${w.unit} · logged daily</div></div>
            <div class="t-value">${w.current.toFixed(1)}</div>
          </div>
          ${weightChart(d)}
          <div class="note">Start ${w.start.toFixed(1)} · Current ${w.current.toFixed(1)} · Change ${w.change >= 0 ? "+" : ""}${w.change.toFixed(1)} ${w.unit}</div>
        </div>
        <div class="card">
          <div class="card-head">
            <div><div class="t-title">Expense Overview</div><div class="t-sub">${e.month}</div></div>
            <div class="t-value small">¥${e.total.toFixed(2)}</div>
          </div>
          ${donut(e.categories, e.total, e.month)}
        </div>
      </div>
      <div class="dash-right">
        <div class="card">
          <div class="card-head"><div><div class="t-title">Cycle Tracker</div><div class="t-sub">Day ${p.dayOfCycle} of ${p.cycleDays}</div></div></div>
          <div class="ring-wrap">
            <div class="cycle-ring" style="--p:${cyclePct}%"><div class="cr-center"><b>Day ${p.dayOfCycle}</b><span>of ${p.cycleDays}</span></div></div>
            <div class="cycle-info">
              <div class="ci-row"><span>Last period</span><b>${p.last}</b></div>
              <div class="ci-row"><span>Next predicted</span><b>${p.next}</b></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="t-title">This Month</div><div class="t-sub">${e.month}</div></div></div>
          <div class="month-stats">
            <div class="month-stat"><b>${ms.weight}</b><span>Weight (kg)</span></div>
            <div class="month-stat"><b>${ms.expense}</b><span>Expenses</span></div>
            <div class="month-stat"><b>${ms.cycle}</b><span>Cycle</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

/* ----------------------------- PLACEHOLDER ------------------------------ */
function placeholderView(id: string, title: string): string {
  return `<section class="view hidden" data-view="${id}">
    <div class="card placeholder">
      <div class="ph-emoji">🌱</div>
      <div class="ph-title">${title}</div>
      <div class="ph-sub">Part of the Bloom design — wiring this section to your vault is the next step.</div>
    </div>
  </section>`;
}

/* ------------------------------- SHELL ---------------------------------- */
export function buildShell(d: BloomData, _now: Date, initialView = "home"): string {
  const navItems = NAV.map(
    (n) =>
      `<button class="nav-item ${n.id === initialView ? "active" : ""}" data-nav="${n.id}">${n.icon}<span>${n.label}</span></button>`
  ).join("");

  const h = HEADER[initialView] ?? HEADER.home;
  const dateLabel = `${d.todayDate.weekday}, ${d.todayDate.solar}`;

  return `<div class="bloom" id="bloom-root">
    <aside class="bloom-sidebar">
      <div class="brand">${bloomMark()}<div class="brand-text"><b>Bloom</b><span>${d.logoSub}</span></div></div>
      <div class="nav-label">MENU</div>
      <nav class="nav">${navItems}</nav>
      <div class="sidebar-footer">
        <div class="profile">
          <div class="avatar">${d.owner.charAt(0)}</div>
          <div class="who"><b>${d.owner}</b><span>${d.planLabel}</span></div>
        </div>
      </div>
    </aside>
    <main class="bloom-main">
      <header class="bloom-header">
        <div class="hdr-greet">
          <div class="hdr-eyebrow" id="hdr-eyebrow">${h.eyebrow}</div>
          <div class="hdr-name" id="hdr-name">${h.name}</div>
          <div class="hdr-date" id="hdr-date">${dateLabel}</div>
        </div>
        <div class="header-right">
          <div class="search-box">${ICONS.search}<input id="bloom-search" type="text" placeholder="Search tasks, notes…" /></div>
          <button class="theme-toggle" id="theme-toggle" title="Toggle light / dark" aria-label="Toggle theme">
            <span class="sun">${ICONS.sun}</span><span class="moon">${ICONS.moon}</span><span class="knob"></span>
          </button>
          <button class="icon-btn" id="settings-btn" title="Settings">${ICONS.settings}</button>
        </div>
      </header>
      <div class="bloom-scroll"><div class="bloom-content">
        ${homeView(d)}
        ${tasksView(d)}
        ${calendarView(d)}
        ${trackersView(d)}
        ${placeholderView("today", "Today")}
        ${placeholderView("learning", "Learning")}
        ${placeholderView("books", "Books")}
        ${placeholderView("projects", "Projects")}
      </div></div>
    </main>
  </div>`;
}

/* --------------------------- CALENDAR NAVIGATION ------------------------ */
/** Track the currently displayed month in the calendar (mutable). */
export type CalNav = { year: number; monthIndex: number };

export function newCalNav(d: BloomData): CalNav {
  return { year: d.calendar.year, monthIndex: d.calendar.monthIndex };
}

/** Re-render the calendar title + grid for an arbitrary month. */
export function setCalendarMonth(root: HTMLElement, d: BloomData, nav: CalNav): void {
  const today = new Date();
  const isCurrentMonth = nav.year === today.getFullYear() && nav.monthIndex === today.getMonth();
  const lead = (new Date(nav.year, nav.monthIndex, 1).getDay() + 6) % 7;
  const days = new Date(nav.year, nav.monthIndex + 1, 0).getDate();
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let cells = "";
  for (let i = 0; i < lead; i++) cells += `<div class="cal-cell empty"></div>`;
  for (let day = 1; day <= days; day++) {
    const jsDow = new Date(nav.year, nav.monthIndex, day).getDay();
    const weekend = jsDow === 0 || jsDow === 6;
    const isToday = isCurrentMonth && day === today.getDate();
    const dayMeta = d.monthEvents[day - 1];
    cells += calCellHtml(dayMeta, isToday, weekend);
  }
  const title = root.querySelector<HTMLElement>(".cal-title");
  if (title) title.textContent = `${MONTHS[nav.monthIndex]} ${nav.year}`;
  const grid = root.querySelector<HTMLElement>("#cal-grid");
  if (grid) grid.innerHTML = dow.map((x) => `<div class="cal-dow">${x}</div>`).join("") + cells;
}

/** Shift month by `delta` (±1, ±2...). */
export function shiftCalendarMonth(nav: CalNav, delta: number): CalNav {
  const total = nav.year * 12 + nav.monthIndex + delta;
  return { year: Math.floor(total / 12), monthIndex: ((total % 12) + 12) % 12 };
}

/** Switch the active view: toggles sections + nav active state + header text. */
export function showView(root: HTMLElement, id: string): void {
  root.querySelectorAll<HTMLElement>(".view").forEach((v) => {
    v.classList.toggle("hidden", v.dataset.view !== id);
  });
  root.querySelectorAll<HTMLElement>(".nav-item").forEach((n) => {
    n.classList.toggle("active", n.dataset.nav === id);
  });
  const h = HEADER[id] ?? HEADER.home;
  const eyebrow = root.querySelector<HTMLElement>("#hdr-eyebrow");
  const name = root.querySelector<HTMLElement>("#hdr-name");
  if (eyebrow) eyebrow.textContent = h.eyebrow;
  if (name) name.textContent = h.name;
}