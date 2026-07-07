import { readFileSync, writeFileSync } from "fs";

const css = readFileSync("src/index.css", "utf8");

const additions = `
/* ── DASHBOARD UTILITIES ── */
.card-interactive {
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  border: 1px solid var(--border);
}
.card-interactive:hover {
  border-color: rgba(180,0,0,0.4);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.card-interactive:active { transform: translateY(0); }
.metric-tile {
  display: flex; flex-direction: column; gap: 0.25rem;
  padding: 1rem; border-radius: 0; border: 1px solid var(--border);
  background: var(--card);
}
.metric-value { font-size: 1.5rem; font-weight: 800; line-height: 1; }
.metric-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; display: flex; align-items: center; gap: 0.375rem; }
.btn-press { transition: transform 0.1s ease; }
.btn-press:active { transform: scale(0.97); }
.stagger > * { animation: fade-in-up 0.3s ease-out both; }
.stagger > *:nth-child(1) { animation-delay: 0s; }
.stagger > *:nth-child(2) { animation-delay: 0.05s; }
.stagger > *:nth-child(3) { animation-delay: 0.1s; }
.stagger > *:nth-child(4) { animation-delay: 0.15s; }
.stagger > *:nth-child(5) { animation-delay: 0.2s; }
.stagger > *:nth-child(6) { animation-delay: 0.25s; }
.stagger > *:nth-child(7) { animation-delay: 0.3s; }
.stagger > *:nth-child(8) { animation-delay: 0.35s; }
.skeleton-shimmer {
  background: linear-gradient(90deg, var(--muted) 0%, color-mix(in srgb, var(--ring) 5%, var(--muted)) 50%, var(--muted) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.bg-warning { background-color: #b45309; }
.bg-primary { background-color: #c41e3a; }
.bg-success { background-color: #4d7c4d; }
.text-success { color: #4d7c4d; }
.bg-success\\/10 { background-color: rgba(77,124,77,0.1); }
.border-success\\/40 { border-color: rgba(77,124,77,0.4); }
`;

writeFileSync("src/index.css", css + "\n" + additions, "utf8");
console.log("Added dashboard utilities,", (css + additions).split('\n').length, "total lines");
