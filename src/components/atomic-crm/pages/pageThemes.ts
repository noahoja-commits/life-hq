// Shared accent palette for page themes and section themes.
export interface PageTheme {
  accent?: string;
}

export const ACCENT_PRESETS: { name: string; accent: string }[] = [
  { name: "Indigo", accent: "#6366f1" },
  { name: "Rose", accent: "#f43f5e" },
  { name: "Emerald", accent: "#10b981" },
  { name: "Amber", accent: "#f59e0b" },
  { name: "Sky", accent: "#0ea5e9" },
  { name: "Violet", accent: "#8b5cf6" },
  { name: "Fuchsia", accent: "#d946ef" },
  { name: "Teal", accent: "#14b8a6" },
  { name: "Orange", accent: "#f97316" },
  { name: "Slate", accent: "#64748b" },
];

export const DEFAULT_ACCENT = "#6366f1";

/** CSS vars that re-theme everything inside a wrapper div. */
export const themeStyle = (accent?: string): React.CSSProperties =>
  accent
    ? ({
        "--primary": accent,
        "--ring": accent,
      } as React.CSSProperties)
    : {};
