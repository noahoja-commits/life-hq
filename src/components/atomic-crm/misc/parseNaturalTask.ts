// Lightweight, dependency-free natural-language parsing for quick task capture.
// "call dentist friday !!" -> { text: "call dentist", due_date: <next Fri>, priority: 2 }

export interface ParsedTask {
  text: string;
  due_date: string | null;
  priority: number;
}

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
};

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const weekdayAhead = (target: number): number => {
  let ahead = (target - new Date().getDay() + 7) % 7;
  if (ahead === 0) ahead = 7; // "friday" on a Friday -> next Friday
  return ahead;
};

export const parseNaturalTask = (input: string): ParsedTask => {
  let text = input.trim();
  let due: string | null = null;
  let priority = 1;

  // Priority: trailing/standalone ! or !!, or keywords.
  if (/(^|\s)!!(\s|$)/.test(text) || /\b(urgent|asap)\b/i.test(text)) {
    priority = 2;
  } else if (/(^|\s)!(\s|$)/.test(text) || /\b(high priority|important)\b/i.test(text)) {
    priority = 2;
  }
  text = text
    .replace(/(^|\s)!{1,2}(\s|$)/g, " ")
    .replace(/\b(urgent|asap|high priority|important)\b/gi, " ")
    .trim();

  // Date phrases (check most specific first). Only strip the matched phrase.
  const patterns: { re: RegExp; resolve: (m: RegExpMatchArray) => string }[] = [
    { re: /\b(today|tonight)\b/i, resolve: () => addDays(0) },
    { re: /\b(tomorrow|tmrw|tmr|tmw)\b/i, resolve: () => addDays(1) },
    { re: /\bnext week\b/i, resolve: () => addDays(7) },
    { re: /\bin (\d+) days?\b/i, resolve: (m) => addDays(parseInt(m[1], 10)) },
    {
      re: /\b(next\s+)?(sunday|sun|monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thu|friday|fri|saturday|sat)\b/i,
      resolve: (m) => {
        const day = WEEKDAYS[m[2].toLowerCase()];
        const ahead = weekdayAhead(day);
        // "next friday" -> the following week's occurrence
        return addDays(m[1] ? ahead + 7 : ahead);
      },
    },
  ];

  for (const p of patterns) {
    const m = text.match(p.re);
    if (m) {
      due = p.resolve(m);
      text = text.replace(p.re, " ").trim();
      break;
    }
  }

  text = text.replace(/\s{2,}/g, " ").replace(/\s+[-–—:]\s*$/, "").trim();
  return { text: text || input.trim(), due_date: due, priority };
};
