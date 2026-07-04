// Shared streak-free calendar heatmap (columns = weeks, rows = Sun..Sat).
// Used by TrackerInsights (13 weeks) and routine cards (8-week rhythm strip).

const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export interface HeatmapCell {
  date: string;
  future: boolean;
  value: number;
}

/** Build the week-columns grid ending this week. */
export const buildHeatmapGrid = (
  dayValue: (isoDate: string) => number,
  weeks: number,
): { columns: HeatmapCell[][]; max: number } => {
  const today = new Date();
  const thisSunday = new Date(today);
  thisSunday.setDate(today.getDate() - today.getDay());
  const columns: HeatmapCell[][] = [];
  let max = 0;
  for (let w = weeks - 1; w >= 0; w--) {
    const col: HeatmapCell[] = [];
    for (let day = 0; day < 7; day++) {
      const cell = new Date(thisSunday);
      cell.setDate(thisSunday.getDate() - w * 7 + day);
      const ds = dateStr(cell);
      const future = cell > today;
      const value = future ? 0 : dayValue(ds);
      if (value > max) max = value;
      col.push({ date: ds, future, value });
    }
    columns.push(col);
  }
  return { columns, max };
};

export const Heatmap = ({
  dayValue,
  weeks = 13,
  accent = "var(--primary)",
  size = "md",
}: {
  dayValue: (isoDate: string) => number;
  weeks?: number;
  accent?: string;
  size?: "sm" | "md";
}) => {
  const { columns, max } = buildHeatmapGrid(dayValue, weeks);

  const cellColor = (value: number, future: boolean) => {
    if (future) return "transparent";
    if (value <= 0) return "var(--muted)";
    const t = max > 0 ? value / max : 0;
    const opacity = 25 + 75 * Math.min(1, t);
    return `color-mix(in oklch, ${accent} ${Math.round(opacity)}%, transparent)`;
  };

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  const cellClass =
    size === "sm" ? "size-2.5 rounded-[3px]" : "size-3.5 rounded-sm";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";

  return (
    <div className={`flex ${gap} overflow-x-auto no-scrollbar py-1`}>
      {columns.map((col, ci) => (
        <div key={ci} className={`flex flex-col ${gap}`}>
          {col.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.future ? "" : fmt(cell.value)}`}
              className={cellClass}
              style={{ backgroundColor: cellColor(cell.value, cell.future) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
