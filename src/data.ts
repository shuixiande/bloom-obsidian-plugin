/* =========================================================================
   Bloom — single source of truth for all views
   Values mirror the real XY153 vault (read 2026-08-16). The design frames in
   Ardot are the visual reference; this dataset supplies the truthful content
   that the HTML must render. Swap `loadBloomData()` for live Obsidian vault
   reads to go production.
   ========================================================================= */

export interface Task {
  name: string;
  category: "Daily" | "Learning" | "Project";
  color: string; // css color for the category tag text
  progress?: number; // 0-100 when the task has a progress bar
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
}

export interface Project {
  name: string;
  progress: number; // 0-100
}

export interface FlowTile {
  label: string;
  icon: string;
}

export interface ExpenseCategory {
  name: string;
  amount: number;
  pct: number;
  color: string; // css color (var or hex)
}

export interface WellnessItem {
  label: string;
  value: string;
  sub: string;
  color?: string;
}

export interface CalEvent {
  day: number;
  kind: "peach" | "peri";
}

export interface ImportantDate {
  date: string;
  title: string;
  color: string; // hex, used for pill + soft tint
}

export interface BloomData {
  owner: string;
  logoSub: string;
  planLabel: string;
  dateLabel: string; // e.g. "Sunday, August 16"
  statStrip: StatItem[];
  todayTasks: TodayTask[];
  projects: Project[];
  dailyFlow: FlowTile[];
  expenses: {
    today: number;
    monthTag: string; // "AUG"
    categories: ExpenseCategory[];
  };
  wellness: WellnessItem[];
  library: { subjects: number; books: number };
  tasks: { todo: Task[]; doing: Task[]; done: Task[] };
  calendar: {
    monthLabel: string;
    year: number;
    monthIndex: number; // 0-based
    firstDayJS: number; // getDay() of day 1 (0=Sun) — Aug 1 2026 is Saturday => 6
    daysInMonth: number;
    today: number;
    events: CalEvent[];
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

export function loadBloomData(): BloomData {
  return {
    owner: "Candice",
    logoSub: "vault OS",
    planLabel: "Free plan",
    dateLabel: "Sunday, August 16",
    statStrip: [
      { label: "Tasks", value: "2/5", sub: "done today" },
      { label: "Weight", value: "50.0", unit: "kg", sub: "0.0 this week" },
      { label: "Cycle", value: "Day 4", sub: "/ 28" },
      { label: "Reading", value: "12", sub: "books read" },
    ],
    todayTasks: [
      { name: "Cook dinner", done: false },
      { name: "Clean litter box", done: true },
      { name: "Water plants", done: false },
      { name: "Skincare routine", done: true },
      { name: "Take out trash", done: false },
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
    calendar: {
      monthLabel: "August 2026",
      year: 2026,
      monthIndex: 7,
      firstDayJS: 6, // Aug 1, 2026 is a Saturday
      daysInMonth: 31,
      today: 16,
      events: [
        { day: 20, kind: "peach" },
        { day: 25, kind: "peri" },
      ],
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
