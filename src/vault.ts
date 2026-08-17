/* =========================================================================
   Bloom — live vault data layer (Obsidian only)
   Reads the real XY153 vault and overrides the static dataset from data.ts.
   Every read is wrapped in try/catch so a missing/renamed file degrades
   gracefully to the static value rather than blanking the dashboard.

   This module imports `obsidian` and is pulled in ONLY by main.ts, so it is
   compiled into main.js and never into the browser prototype.js.
   ========================================================================= */
import { App } from "obsidian";
import { loadBloomData } from "./data";
import type { BloomData, Task, CalEvent, ImportantDate, ExpenseCategory } from "./data";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EXPENSE_COLORS: Record<string, string> = {
  Food: "#d9a340",
  Shopping: "#e8935f",
  Transport: "#5ca3a1",
  Pet: "#7fb069",
  Home: "#7d8cc4",
  Health: "#e07a9c",
  Beauty: "#c77baf",
  Other: "var(--accent)",
};

/* ----------------------------- markdown utils -------------------------- */
function stripCode(md: string): string {
  return md.replace(/```[\s\S]*?```/g, "");
}

function readTable(block: string): string[][] {
  const rows: string[][] = [];
  for (const line of block.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    if (/^\|[\s:-]+\|$/.test(t)) continue; // separator row
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

/* ------------------------------- live load ----------------------------- */
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

  const todayTasks = rawDaily.slice(0, 6).map((t) => ({ name: t.name, done: t.done }));
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

  /* ---- Calendar: month grid + important dates + today note ---- */
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  d.calendar = {
    monthLabel: `${MONTHS[monthIndex]} ${year}`,
    year,
    monthIndex,
    firstDayJS: new Date(year, monthIndex, 1).getDay(),
    daysInMonth: new Date(year, monthIndex + 1, 0).getDate(),
    today: now.getDate(),
    events: d.calendar.events,
  };
  const cal = await read("12-Calendar/Monthly Calendar.md");
  if (cal) {
    const rows = tablesAfter(cal, "## Important Dates");
    const events: CalEvent[] = [];
    const imp: ImportantDate[] = [];
    const palette = ["#e8935f", "#7d8cc4", "#7fb069", "#e07a9c"];
    rows.forEach((r) => {
      const dateStr = r[0] || "";
      const title = r[1]?.replace(/\*.*?\*|\(.*?\)/g, "").trim() ?? "";
      if (!dateStr || !title || /example/i.test(title)) return;
      const dm = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (!dm) return;
      const day = parseInt(dm[3], 10);
      events.push({ day, kind: /doctor|appointment|预约|医生/.test(title) ? "peri" : "peach" });
      imp.push({ date: fmtShort(dateStr), title, color: palette[imp.length % palette.length] });
    });
    if (events.length) d.calendar.events = events;
    if (imp.length) d.importantDates = imp;
  }

  /* ---- Daily note -> Today Note card ---- */
  const dn = await read(`12-Calendar/Daily Notes/${fmtISO(now)}.md`);
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
    if (lines.length) d.todayNote = { title: `Daily Note · ${fmtShort(fmtISO(now))}`, lines };
  }

  /* ---- Library: subjects + books ---- */
  const learn = await read("14-Learning/README.md");
  if (learn) {
    const subj = tablesAfter(learn, "## Subjects").filter((r) => r[0] && !/^Subject/i.test(r[0])).length;
    if (subj > 0) d.library = { subjects: subj, books: d.library.books };
  }
  const books = await read("15-Books/Book List.md");
  if (books) {
    const count = readTable(stripCode(books)).filter(
      (r) => r[0] && !/^(Title|Category|Book|Subject|Author)/i.test(r[0])
    ).length;
    if (count > 0) d.library.books = count;
  }

  return d;
}
