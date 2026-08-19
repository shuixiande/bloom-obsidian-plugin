/* =========================================================================
   Bloom — live vault data layer (Obsidian only)
   Reads the real XY153 vault and overrides the static dataset from data.ts.
   Every read is wrapped in try/catch so a missing/renamed file degrades
   gracefully to the static value rather than blanking the dashboard.

   This module imports `obsidian` AND `lunar-typescript` and is pulled in ONLY
   by main.ts, so it is compiled into main.js and never into the browser
   prototype.js.
   ========================================================================= */
import { App } from "obsidian";
// @ts-ignore — lunar-typescript ships its own d.ts but esbuild is strict
import { Solar, HolidayUtil } from "lunar-typescript";
import { loadBloomData } from "./data";
import type {
  BloomData,
  Task,
  CalEvent,
  DayMeta,
  TopTask,
  ImportantDate,
  ExpenseCategory,
  BookSection,
  BookItem,
  StudyTaskItem,
} from "./data";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const EXPENSE_COLORS: Record<string, string> = {
  Food: "#d9a340",
  Shopping: "#e8935f",
  Transport: "#5ca3a1",
  Pet: "#7fb069",
  Home: "#7d8cc4",
  Health: "#e07a9c",
  Beauty: "#c77baf",
  Other: "var(--accent)",
};

const EXPENSE_FILE = "13-Trackers/Expense Tracker.md";
const BOOK_FILE = "15-Books/Book List.md";
const STUDY_FILE = "11-Todo/Study Tasks.md";

// Default palette for color dots in schedule rows when "Color" column is empty.
const DEFAULT_DOT_COLOR = "#7d8cc4"; // periwinkle

/* ----------------------------- markdown utils -------------------------- */
function stripCode(md: string): string {
  return md.replace(/```[\s\S]*?```/g, "");
}

function readTable(block: string): string[][] {
  const rows: string[][] = [];
  for (const line of block.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    // separator row: |---|---| — allow pipes inside so multi-col tables work
    if (/^\|[\s:|-]+\|$/.test(t)) continue;
    rows.push(t.split("|").slice(1, -1).map((c) => c.trim()));
  }
  return rows;
}

/** All markdown tables that appear after `header` and before the next `## `. */
function tablesAfter(md: string, header: string): string[][] {
  const i = md.indexOf(header);
  if (i < 0) return [];
  const rest = md.slice(i);
  const end = rest.search(/\n##\s/);
  const block = end > 0 ? rest.slice(0, end) : rest;
  return readTable(block);
}

/** Frontmatter key/value map from a markdown file. */
function parseFrontmatter(md: string): Record<string, string> {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    // strip surrounding quotes
    v = v.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    out[kv[1]] = v;
  }
  return out;
}

function fmtISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "2026-08-20" -> "Aug 20" */
function fmtShort(iso: string): string {
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${MONTHS[parseInt(m[2], 10) - 1].slice(0, 3)} ${parseInt(m[3], 10)}`;
}

/** Map a color emoji or name to a CSS color. */
function emojiToColor(emoji: string | undefined): string | undefined {
  if (!emoji) return undefined;
  const e = emoji.trim();
  if (/🟣|💜|purple/i.test(e)) return "#7d8cc4"; // periwinkle
  if (/🔵|💙|blue/i.test(e)) return "#5ca3a1";   // teal
  if (/🟢|💚|green/i.test(e)) return "#7fb069";  // sage
  if (/🟡|💛|yellow|gold/i.test(e)) return "#d9a340";
  if (/🟠|🟧|orange|peach/i.test(e)) return "#e8935f";
  if (/🔴|❤️|red|pink/i.test(e)) return "#e07a9c";
  if (/⚫|⚪|black|gray/i.test(e)) return "#5a5660";
  return DEFAULT_DOT_COLOR;
}

/** Compute lunar label for a solar date, e.g. "廿三" / "初一". */
function lunarLabelFor(y: number, m1: number, d: number): string {
  try {
    const solar = Solar.fromYmd(y, m1 + 1, d); // lunar lib is 1-based month
    const lunar = solar.getLunar();
    return lunar.getDayInChinese();
  } catch {
    return "";
  }
}

function lunarMonthLabelFor(y: number, m1: number): string {
  try {
    const solar = Solar.fromYmd(y, m1 + 1, 1);
    return solar.getLunar().getMonthInChinese();
  } catch {
    return "";
  }
}

/** Public holiday name for a solar date ("教师节", "国庆节", ...). */
function holidayNameFor(y: number, m1: number, d: number): string | null {
  try {
    const h = HolidayUtil.getHoliday(y, m1 + 1, d);
    if (h && h.isWork() === false) return h.getName();
  } catch {
    /* fall through to extra list below */
  }
  // Non-statutory observances the reference design shows as copper banners
  const key = `${m1 + 1}-${d}`;
  const extra: Record<string, string> = {
    "2-14": "情人节",
    "3-8": "妇女节",
    "4-1": "愚人节",
    "5-4": "青年节",
    "6-1": "儿童节",
    "9-10": "教师节",
    "10-31": "万圣节",
    "12-24": "平安夜",
    "12-25": "圣诞节",
  };
  return extra[key] ?? null;
}

type RawTask = { name: string; done: boolean; category: Task["category"] };

function catColor(c: Task["category"]): string {
  return c === "Daily" ? "#b5627c" : c === "Learning" ? "#4f7a3a" : "#5a6aa0";
}

/** Collect `- [ ]` / `- [x]` tasks, skipping empty template / example rows. */
function collectTasks(md: string | null, category: Task["category"]): RawTask[] {
  const out: RawTask[] = [];
  if (!md) return out;
  for (const line of stripCode(md).split("\n")) {
    const m = line.match(/^\s*-\s*\[([ xX])\]\s*(.*)$/);
    if (!m) continue;
    const raw = m[2];
    if (!raw.trim()) continue;
    if (/\(example\)|（模拟任务）|\(模擬任務\)/.test(raw)) continue;
    const name = raw
      .replace(/\s*→\s*\[\[[^\]]*\]\]/g, "")
      .replace(/\s*\*\s*\(.*?\)\s*/g, "")
      .replace(/[*(]/g, "")
      .trim();
    if (!name) continue;
    out.push({ name, done: m[1].toLowerCase() === "x", category });
  }
  return out;
}

/** Parse `## Active Projects` → [{ name, progress }], skipping template stubs. */
function parseProjects(md: string): { name: string; progress: number }[] {
  const out: { name: string; progress: number }[] = [];
  const clean = stripCode(md);
  const i = clean.indexOf("## Active Projects");
  if (i < 0) return out;
  const rest = clean.slice(i);
  const end = rest.search(/\n##\s/);
  const block = end > 0 ? rest.slice(0, end) : rest;
  const lines = block.split("\n");
  for (let k = 0; k < lines.length; k++) {
    const h = lines[k].match(/^###\s+\d+\.\s+(.*)$/);
    if (!h) continue;
    const name = h[1].trim();
    if (!name || /name here|second project/i.test(name)) continue;
    let progress = 0;
    for (let j = 1; j <= 4 && k + j < lines.length; j++) {
      const pm = lines[k + j].match(/<progress\s+value="(\d+)"/);
      if (pm) { progress = parseInt(pm[1], 10); break; }
    }
    out.push({ name, progress });
  }
  return out;
}

/** Parse the per-day `## ⏰ Schedule` table into CalEvent[]. */
function parseSchedule(md: string): CalEvent[] {
  const out: CalEvent[] = [];
  const rows = tablesAfter(md, "## ⏰ Schedule");
  for (const r of rows) {
    const time = r[0] || "";
    const label = r[1] || "";
    if (!label) continue;
    if (/^(time|Time)$/i.test(time)) continue; // header row
    const color = emojiToColor(r[2]);
    out.push({ day: 0, kind: "task", time, label, color });
  }
  return out;
}

/** Parse `15-Books/Book List.md` → BookSection[] grouped by category. */
export function parseBooks(md: string): BookSection[] {
  const out: BookSection[] = [];
  const clean = stripCode(md);
  const lines = clean.split("\n");
  let cur: BookSection | null = null;
  for (const line of lines) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) {
      const cat = h[1].trim();
      // Skip index / legend / helper sections — keep only the per-category book tables.
      if (/Categories|Status Legend|How to Add|Related|Reading Notes/.test(cat)) {
        cur = null;
        continue;
      }
      cur = { category: cat, items: [] };
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    if (/^\|[\s:|-]+\|$/.test(t)) continue; // separator row
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4) continue;
    if (/^Title$/i.test(cells[0])) continue; // header row
    if (cells.every((c) => c === "" || c === "—" || /\(example\)/i.test(c))) continue; // empty/example
    const item: BookItem = {
      title: cells[0].replace(/\*\(example\)\*/g, "").trim(),
      author: cells[1] || "",
      status: cells[2] || "",
      note: cells[3] || "",
    };
    cur.items.push(item);
  }
  return out;
}

/** Parse `11-Todo/Study Tasks.md` → today's study tasks (checkbox list). */
export function parseStudyTasks(md: string): StudyTaskItem[] {
  const out: StudyTaskItem[] = [];
  const clean = stripCode(md);
  const lines = clean.split("\n");
  const idx = lines.findIndex((l) => l.includes("##") && l.includes("Today's Study"));
  if (idx < 0) return out;
  for (let i = idx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) break;
    const m = lines[i].match(/^\s*-\s*\[([ xX])\]\s*(.*)$/);
    if (!m) continue;
    const raw = m[2].replace(/[*(]/g, "").trim();
    if (!raw || /（模拟任务）/.test(raw)) continue;
    out.push({ name: raw, done: m[1].toLowerCase() === "x" });
  }
  return out;
}

/**
 * Append one row to the `## 📝 Daily Expense Log` table in Expense Tracker.md.
 * Inserts after the last data row of that table (before the following `---`/`## `).
 */
export async function appendExpenseRow(
  app: App,
  row: { date: string; category: string; item: string; amount: number }
): Promise<void> {
  let content: string;
  try {
    content = await app.vault.adapter.read(EXPENSE_FILE);
  } catch {
    return;
  }
  const lines = content.split("\n");
  const headerIdx = lines.findIndex(
    (l) => l.includes("##") && l.includes("Daily Expense Log")
  );
  if (headerIdx < 0) return;
  let lastRow = -1;
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const tr = lines[i].trim();
    if (tr.startsWith("|")) lastRow = i;
    else if (tr === "" || tr.startsWith("---")) break;
    else break;
  }
  if (lastRow < 0) return;
  const newRow = `| ${row.date} | ${row.category} | ${row.item || "—"} | ${row.amount.toFixed(2)} |`;
  lines.splice(lastRow + 1, 0, newRow);
  await app.vault.adapter.write(EXPENSE_FILE, lines.join("\n"));
}

/**
 * Append a book to the chosen category section of Book List.md.
 * Reuses an existing empty data row if present, otherwise appends after the table.
 */
export async function appendBookRow(
  app: App,
  row: { category: string; title: string; author: string; status: string; note: string }
): Promise<void> {
  let content: string;
  try {
    content = await app.vault.adapter.read(BOOK_FILE);
  } catch {
    return;
  }
  const lines = content.split("\n");
  const catIdx = lines.findIndex((l) => l.startsWith("##") && l.includes(row.category));
  if (catIdx < 0) return;
  let firstData = -1;
  let tableEnd = -1;
  for (let i = catIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) break;
    const tr = lines[i].trim();
    if (tr.startsWith("|")) {
      if (firstData < 0) firstData = i;
      tableEnd = i;
    }
  }
  if (tableEnd < 0) return;
  // Prefer an empty data row: |  |  |  |  | (blank, em-dash, or example placeholder)
  let target = -1;
  for (let i = firstData + 1; i <= tableEnd; i++) {
    const cells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length && cells.every((c) => c === "" || c === "—" || /\(example\)/i.test(c))) {
      target = i;
      break;
    }
  }
  const newRow = `| ${row.title} | ${row.author || "—"} | ${row.status || "⬜ Want to read"} | ${row.note || "—"} |`;
  if (target >= 0) lines[target] = newRow;
  else lines.splice(tableEnd + 1, 0, newRow);
  await app.vault.adapter.write(BOOK_FILE, lines.join("\n"));
}

/** Append `- [ ] name` to the "Today's Study" list in Study Tasks.md. */
export async function appendStudyTask(app: App, name: string): Promise<void> {
  let content: string;
  try {
    content = await app.vault.adapter.read(STUDY_FILE);
  } catch {
    return;
  }
  const lines = content.split("\n");
  const idx = lines.findIndex((l) => l.includes("##") && l.includes("Today's Study"));
  if (idx < 0) return;
  let insertAt = idx + 1;
  for (let i = idx + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      insertAt = i;
      break;
    }
    if (/^\s*-\s*\[[ xX]\]/.test(lines[i])) insertAt = i + 1;
  }
  lines.splice(insertAt, 0, "- [ ] " + name);
  await app.vault.adapter.write(STUDY_FILE, lines.join("\n"));
}
export async function loadBloomDataLive(app: App): Promise<BloomData> {
  const d = loadBloomData(); // static fallback — never blank
  const now = new Date();
  const read = async (p: string): Promise<string | null> => {
    try { return await app.vault.adapter.read(p); } catch { return null; }
  };

  /* ---- Weight ---- */
  const wt = await read("13-Trackers/Weight Tracker.md");
  if (wt) {
    const rows = tablesAfter(wt, "## Daily Weight Log")
      .filter((r) => r[0] && r[1] && !isNaN(parseFloat(r[1])))
      .map((r) => ({ date: r[0], w: parseFloat(r[1]) }));
    if (rows.length) {
      const current = rows[rows.length - 1].w;
      const start = rows[0].w;
      const change = +(current - start).toFixed(1);
      d.trackers.weight = { current, start, change, unit: "kg", points: rows.map((r) => r.w), labels: rows.map((r) => r.date) };
      d.statStrip[1] = { label: "Weight", value: current.toFixed(1), unit: "kg", sub: `${change >= 0 ? "+" : ""}${change} this week` };
      d.wellness[0] = { label: "Weight", value: `${current.toFixed(1)} kg`, sub: `${change >= 0 ? "+" : ""}${change} this week`, color: "var(--c-sage)" };
      d.trackers.month.weight = current.toFixed(1);
    }
  }

  /* ---- Period ---- */
  const pt = await read("13-Trackers/Period Tracker.md");
  if (pt) {
    const rows = tablesAfter(pt, "## Current Cycle");
    const get = (k: string) => rows.find((r) => r[0].includes(k))?.[1]?.trim() ?? "";
    const last = get("Last period");
    const cycleDays = parseInt(get("Cycle length"), 10) || 28;
    const next = get("Predicted next");
    const dayOfCycle = parseInt(get("Today is day"), 10) || 1;
    d.trackers.period = { dayOfCycle, cycleDays, last, next };
    d.statStrip[2] = { label: "Cycle", value: `Day ${dayOfCycle}`, sub: `/ ${cycleDays}` };
    d.wellness[1] = { label: "Cycle", value: `Day ${dayOfCycle}`, sub: `Next · ${fmtShort(next)}`, color: "var(--c-peri)" };
    d.trackers.month.cycle = `Day ${dayOfCycle}`;
  }

  /* ---- Expenses ---- */
  const ex = await read("13-Trackers/Expense Tracker.md");
  if (ex) {
    const rows = tablesAfter(ex, "## Daily Expense Log")
      .filter((r) => r[0] && !isNaN(parseFloat(r[3])))
      .map((r) => ({ date: r[0], cat: r[1] || "Other", amt: parseFloat(r[3]) }));
    if (rows.length) {
      const sums = new Map<string, number>();
      rows.forEach((r) => sums.set(r.cat, (sums.get(r.cat) ?? 0) + r.amt));
      const total = [...sums.values()].reduce((a, b) => a + b, 0);
      const categories: ExpenseCategory[] = [...sums.entries()].map(([name, amount]) => ({
        name,
        amount: +amount.toFixed(2),
        pct: Math.round((amount / total) * 100) || 0,
        color: EXPENSE_COLORS[name] ?? "var(--accent)",
      }));
      const todayAmt = rows.filter((r) => r.date === fmtISO(now)).reduce((a, b) => a + b.amt, 0);
      const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
      d.expenses = { today: +todayAmt.toFixed(2), monthTag: MONTHS[now.getMonth()].slice(0, 3).toUpperCase(), categories };
      d.trackers.expense = { total: +total.toFixed(2), month: monthLabel, categories };
      d.trackers.month.expense = `¥${total.toFixed(0)}`;
    }
  }

  /* ---- Todos: Today's Tasks + board To Do / Done ---- */
  const rawDaily = collectTasks(await read("11-Todo/Daily Tasks.md"), "Daily");
  const rawStudy = collectTasks(await read("11-Todo/Study Tasks.md"), "Learning");
  const rawProj = collectTasks(await read("11-Todo/Project Tasks.md"), "Project");

  const todayTasks = rawDaily.slice(0, 6).map((t) => ({ name: t.name, done: t.done, file: "11-Todo/Daily Tasks.md" }));
  if (todayTasks.length) {
    const done = todayTasks.filter((t) => t.done).length;
    d.todayTasks = todayTasks;
    d.statStrip[0] = { label: "Tasks", value: `${done}/${todayTasks.length}`, sub: "done today" };
  }

  const all = [...rawDaily, ...rawStudy, ...rawProj];
  const toTask = (t: RawTask): Task => ({ name: t.name, category: t.category, color: catColor(t.category) });
  d.tasks = {
    todo: all.filter((t) => !t.done).map(toTask),
    done: all.filter((t) => t.done).map(toTask),
    doing: d.tasks.doing, // filled below from projects
  };

  /* ---- Projects: Active Projects + board In Progress ---- */
  const pd = await read("10-Projects/Project Dashboard.md");
  if (pd) {
    const projs = parseProjects(pd);
    if (projs.length) {
      d.projects = projs.map((p) => ({ name: p.name, progress: p.progress }));
      d.tasks.doing = projs.map((p) => ({
        name: p.name,
        category: "Project" as const,
        color: "#5a6aa0",
        progress: p.progress,
      }));
    }
  }

  /* ---- Top Task from today's Daily Note frontmatter ---- */
  const todayISO = fmtISO(now);
  const dn = await read(`12-Calendar/Daily Notes/${todayISO}.md`);
  if (dn) {
    const fm = parseFrontmatter(dn);
    if (fm["topTask"]) {
      d.topTask = { title: fm["topTask"], file: `12-Calendar/Daily Notes/${todayISO}.md`, done: false };
    }
  }
  if (!d.topTask) {
    // Fallback: first unchecked Daily Task
    const first = rawDaily.find((t) => !t.done);
    if (first) d.topTask = { title: first.name, file: "11-Todo/Daily Tasks.md", done: false };
  }
  d.moreTasksToday = rawDaily.filter((t) => !t.done).length - 1;

  /* ---- Calendar grid + month events ---- */
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  d.calendar = {
    monthLabel: `${MONTHS[monthIndex]} ${year}`,
    year,
    monthIndex,
    firstDayJS: new Date(year, monthIndex, 1).getDay(),
    daysInMonth,
    today: now.getDate(),
  };

  // Build monthEvents: lunar label + scheduled events from each day's Daily Note
  const monthEvents: DayMeta[] = [];
  for (let d1 = 1; d1 <= daysInMonth; d1++) {
    const date = new Date(year, monthIndex, d1);
    const iso = fmtISO(date);
    const dayMd = await read(`12-Calendar/Daily Notes/${iso}.md`);
    const events: CalEvent[] = [];
    // Public holidays (Chinese) from lunar-typescript — adds as banner-style event
    const hol = holidayNameFor(year, monthIndex, d1);
    if (hol) events.push({ day: d1, kind: "holiday", label: hol, color: "#b87b5a" });
    // Per-day Schedule table
    if (dayMd) {
      for (const e of parseSchedule(dayMd)) {
        events.push({ ...e, day: d1 });
      }
    }
    monthEvents.push({ day: d1, lunarLabel: lunarLabelFor(year, monthIndex, d1), events });
  }
  // Important Dates from Monthly Calendar.md
  const cal = await read("12-Calendar/Monthly Calendar.md");
  if (cal) {
    const rows = tablesAfter(cal, "## Important Dates");
    const imp: ImportantDate[] = [];
    const palette = ["#e8935f", "#7d8cc4", "#7fb069", "#e07a9c"];
    rows.forEach((r) => {
      const dateStr = r[0] || "";
      const title = r[1]?.replace(/\*.*?\*|\(.*?\)/g, "").trim() ?? "";
      if (!dateStr || !title || /example/i.test(title)) return;
      const dm = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (!dm) return;
      const day = parseInt(dm[3], 10);
      // Insert as task kind (rendered as colored dot, not banner)
      const target = monthEvents[day - 1];
      if (target) {
        target.events.push({
          day,
          kind: /doctor|appointment|预约|医生/i.test(title) ? "task" : "task",
          time: "all day",
          label: title,
          color: palette[imp.length % palette.length],
        });
      }
      imp.push({ date: fmtShort(dateStr), title, color: palette[imp.length % palette.length] });
    });
    if (imp.length) d.importantDates = imp;
  }
  d.monthEvents = monthEvents;

  /* ---- Today Note card ---- */
  if (dn) {
    const lines: string[] = [];
    const wM = dn.match(/weight:\s*"(\d+(?:\.\d+)?)"/i) ?? dn.match(/\|\s*Weight \(kg\)\s*\|\s*(\d+(?:\.\d+)?)\s*\|/);
    const weight = wM ? parseFloat(wM[1]) : NaN;
    const moodM = dn.match(/\|\s*Mood\s*\|\s*([^|]+)\|/);
    let mood = "";
    if (moodM) {
      const m = moodM[1];
      if (/😊|🙂|good|happy|good/i.test(m)) mood = "good";
      else if (/😔|😟|sad|low/i.test(m)) mood = "low";
    }
    if (!isNaN(weight)) lines.push(`Weight ${weight} kg${mood ? " · Mood: " + mood : ""}`);
    const totalM = dn.match(/\|\s*\*\*Total\*\*\s*\|[^|]*\|\s*\*\*(\d+(?:\.\d+)?)\*\*/);
    if (totalM) lines.push(`Expenses: ¥${totalM[1]}`);
    if (lines.length) d.todayNote = { title: `Daily Note · ${fmtShort(todayISO)}`, lines };
  }

  /* ---- Library: subjects + books ---- */
  const learn = await read("14-Learning/README.md");
  if (learn) {
    const subj = tablesAfter(learn, "## Subjects").filter((r) => r[0] && !/^Subject/i.test(r[0])).length;
    if (subj > 0) d.library = { subjects: subj, books: d.library.books };
  }
  const books = await read(BOOK_FILE);
  if (books) {
    const sections = parseBooks(books);
    const count = sections.reduce((n, s) => n + s.items.length, 0);
    if (count > 0) d.library.books = count;
    if (sections.length) d.books = sections;
  }

  /* ---- Study tasks: today's study list ---- */
  const study = await read(STUDY_FILE);
  if (study) {
    const tasks = parseStudyTasks(study);
    if (tasks.length) d.studyTasks = tasks;
  }

  /* ---- Today date ---- */
  d.todayDate = {
    solar: `${MONTHS[now.getMonth()].slice(0, 3)} ${now.getDate()}`,
    weekday: WEEKDAYS[now.getDay()],
    lunar: `${lunarMonthLabelFor(year, monthIndex)}${lunarLabelFor(year, monthIndex, now.getDate())}`,
  };

  return d;
}