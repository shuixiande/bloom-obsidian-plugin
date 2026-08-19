/* =========================================================================
   Bloom — single source of truth for all views.
   Static defaults mirror a realistic vault populated with the user's routine
   (8pm Medication, 9pm Reading, 7pm Bible study) so the prototype renders the
   intended look. Swap `loadBloomData()` for live Obsidian vault reads via
   `loadBloomDataLive()` in `vault.ts` to go production.
   ========================================================================= */

export interface Task {
  name: string;
  category: "Daily" | "Learning" | "Project";
  color: string;
  progress?: number;
}

export interface StatItem {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
}

export interface TodayTask {
  name: string;
  done: boolean;
  file?: string;
}

export interface Project {
  name: string;
  progress: number;
}

export interface FlowTile {
  label: string;
  icon: string;
}

export interface ExpenseCategory {
  name: string;
  amount: number;
  pct: number;
  color: string;
}

export interface WellnessItem {
  label: string;
  value: string;
  sub: string;
  color?: string;
}

/** A timed or named event that lands on a specific calendar day. */
export interface CalEvent {
  day: number;          // 1-based day-of-month
  kind: "holiday" | "task" | "routine" | "note";
  label: string;        // shown in the cell: "Medication (Time Blocking)"
  time?: string;        // "8pm" or "20:00" — optional, displayed before label
  color?: string;       // optional override for the dot color
}

/** Per-day metadata for the monthly grid (lunar label + all events). */
export interface DayMeta {
  day: number;
  lunarLabel?: string;  // "廿三" / "初一"
  events: CalEvent[];   // already sorted: holiday first, then by time
}

export interface ImportantDate {
  date: string;
  title: string;
  color: string;
}

/** A single book entry inside a category section of the Book List. */
export interface BookItem {
  title: string;
  author: string;
  status: string;
  note: string;
}

/** A category section in the Book List (e.g. "📗 Economics & Finance"). */
export interface BookSection {
  category: string;
  items: BookItem[];
}

/** A checkable study task (from "Today's Study" in Study Tasks.md). */
export interface StudyTaskItem {
  name: string;
  done: boolean;
}

export interface TopTask {
  title: string;
  description?: string;
  file?: string;        // source md, used for write-back
  done: boolean;
}

export interface TodayDate {
  solar: string;        // "Aug 16"
  weekday: string;      // "Sunday"
  lunar: string;        // "七月初二" (best-effort)
}

export interface BloomData {
  owner: string;
  logoSub: string;
  planLabel: string;
  dateLabel: string;
  todayDate: TodayDate;
  /** Today's #1 task — the single most prominent item on the home dashboard. */
  topTask: TopTask | null;
  /** Remaining tasks for today (sorted: incomplete first, then completed). */
  moreTasksToday: number;
  // Legacy fields kept so non-home views keep compiling (Tasks, Trackers still
  // consume them). Home view no longer renders them.
  statStrip: StatItem[];
  todayTasks: TodayTask[];
  projects: Project[];
  dailyFlow: FlowTile[];
  expenses: { today: number; monthTag: string; categories: ExpenseCategory[] };
  wellness: WellnessItem[];
  library: { subjects: number; books: number };
  tasks: { todo: Task[]; doing: Task[]; done: Task[] };
  // Per-day metadata for the redesigned calendar grid (length = daysInMonth).
  monthEvents: DayMeta[];
  // Books grouped by category (15-Books/Book List.md).
  books: BookSection[];
  // Today's study tasks (11-Todo/Study Tasks.md → "Today's Study").
  studyTasks: StudyTaskItem[];
  // Bookkeeping the calendar header still needs.
  calendar: {
    monthLabel: string;
    year: number;
    monthIndex: number;
    firstDayJS: number;
    daysInMonth: number;
    today: number;
  };
  importantDates: ImportantDate[];
  todayNote: { title: string; lines: string[] };
  trackers: {
    weight: { current: number; start: number; change: number; unit: string; points: number[]; labels: string[] };
    expense: { total: number; month: string; categories: ExpenseCategory[] };
    period: { dayOfCycle: number; cycleDays: number; last: string; next: string };
    month: { weight: string; expense: string; cycle: string };
  };
}

// ---------- helpers (pure) ---------------------------------------------------

const ROUTINE_COLOR = "#7d8cc4";          // periwinkle — daily routine
const MEDICATION_COLOR = "#b5627c";       // pink — medication (Time Blocking)
const BIBLE_COLOR = "#7fb069";            // sage — Bible study
const HOLIDAY_COLOR = "#b87b5a";          // copper — holidays (banner style)

/** Generate a realistic August 2026 month of routine events as static fallback. */
function defaultMonthEvents(): DayMeta[] {
  const events: DayMeta[] = [];
  for (let day = 1; day <= 31; day++) {
    const dayEvents: CalEvent[] = [];
    // Medication every day at 8pm (Time Blocking)
    dayEvents.push({ day, kind: "routine", time: "8pm", label: "Medication (Time Blocking)", color: MEDICATION_COLOR });
    // Reading every day at 9pm
    dayEvents.push({ day, kind: "routine", time: "9pm", label: "Reading", color: ROUTINE_COLOR });
    // Bible study Mon/Wed/Fri at 7pm
    if ([1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31].includes(day)) {
      dayEvents.push({ day, kind: "routine", time: "7pm", label: "Bible study", color: BIBLE_COLOR });
    }
    events.push({ day, events: dayEvents });
  }
  // Chinese public holidays for Aug 2026 (none in Aug — placeholder for Sept)
  // Sample important-date events on Aug 20 + 25 (kept from old design)
  events[19].events.push({ day: 20, kind: "task", time: "10am", label: "Dentist appointment", color: "#e8935f" });
  events[24].events.push({ day: 25, kind: "task", time: "all day", label: "Project deadline", color: "#7d8cc4" });
  return events;
}

export function loadBloomData(): BloomData {
  return {
    owner: "Candice",
    logoSub: "vault OS",
    planLabel: "Free plan",
    dateLabel: "Sunday, August 16",
    todayDate: {
      solar: "Aug 16",
      weekday: "Sunday",
      lunar: "七月初二",
    },
    topTask: {
      title: "Cook dinner",
      description: "Make the chicken stir-fry, set the table, eat before 8pm medication.",
      file: "11-Todo/Daily Tasks.md",
      done: false,
    },
    moreTasksToday: 4,
    statStrip: [
      { label: "Tasks", value: "2/5", sub: "done today" },
      { label: "Weight", value: "50.0", unit: "kg", sub: "0.0 this week" },
      { label: "Cycle", value: "Day 4", sub: "/ 28" },
      { label: "Reading", value: "12", sub: "books read" },
    ],
    todayTasks: [
      { name: "Cook dinner", done: false, file: "11-Todo/Daily Tasks.md" },
      { name: "Clean litter box", done: true, file: "11-Todo/Daily Tasks.md" },
      { name: "Water plants", done: false, file: "11-Todo/Daily Tasks.md" },
      { name: "Skincare routine", done: true, file: "11-Todo/Daily Tasks.md" },
      { name: "Take out trash", done: false, file: "11-Todo/Daily Tasks.md" },
    ],
    projects: [
      { name: "Redesign portfolio", progress: 60 },
      { name: "Learn Python", progress: 35 },
    ],
    dailyFlow: [
      { label: "Today", icon: "☀" },
      { label: "Tasks", icon: "✓" },
      { label: "Learn", icon: "📚" },
      { label: "Capture", icon: "✎" },
      { label: "Review", icon: "↺" },
    ],
    expenses: {
      today: 45.0,
      monthTag: "AUG",
      categories: [{ name: "Other", amount: 45.0, pct: 100, color: "var(--accent)" }],
    },
    wellness: [
      { label: "Weight", value: "50.0 kg", sub: "0.0 this week", color: "var(--c-sage)" },
      { label: "Cycle", value: "Day 4", sub: "Next · Sep 10", color: "var(--c-peri)" },
    ],
    library: { subjects: 5, books: 12 },
    tasks: {
      todo: [
        { name: "Cook dinner", category: "Daily", color: "#b5627c" },
        { name: "Water plants", category: "Daily", color: "#b5627c" },
        { name: "Take out trash", category: "Daily", color: "#b5627c" },
        { name: "Study economics", category: "Learning", color: "#4f7a3a" },
        { name: "Practice AI coding", category: "Learning", color: "#4f7a3a" },
      ],
      doing: [
        { name: "Clean litter box", category: "Daily", color: "#b5627c" },
        { name: "Skincare routine", category: "Daily", color: "#b5627c" },
        { name: "Redesign portfolio", category: "Project", color: "#5a6aa0", progress: 60 },
        { name: "Learn Python", category: "Learning", color: "#4f7a3a", progress: 35 },
      ],
      done: [
        { name: "Set up vault", category: "Daily", color: "#b5627c" },
        { name: "Task 4", category: "Project", color: "#5a6aa0" },
        { name: "Skincare science", category: "Learning", color: "#4f7a3a" },
      ],
    },
    monthEvents: defaultMonthEvents(),
    books: [],
    studyTasks: [],
    calendar: {
      monthLabel: "August 2026",
      year: 2026,
      monthIndex: 7,
      firstDayJS: 6, // Aug 1, 2026 is Saturday
      daysInMonth: 31,
      today: 16,
    },
    importantDates: [
      { date: "Aug 20", title: "Dentist appointment", color: "#e8935f" },
      { date: "Aug 25", title: "Project deadline", color: "#7d8cc4" },
    ],
    todayNote: {
      title: "Daily Note · Aug 16",
      lines: ["Weight 50 kg · Mood: good", "Study 25 min — economics", "Expenses: ¥45"],
    },
    trackers: {
      weight: {
        current: 50.0,
        start: 50.0,
        change: 0.0,
        unit: "kg",
        points: [50.0],
        labels: ["Aug 16"],
      },
      expense: {
        total: 45.0,
        month: "August 2026",
        categories: [{ name: "Other", amount: 45.0, pct: 100, color: "var(--accent)" }],
      },
      period: { dayOfCycle: 4, cycleDays: 28, last: "2026-08-13", next: "2026-09-10" },
      month: { weight: "50.0", expense: "¥45", cycle: "Day 4" },
    },
  };
}