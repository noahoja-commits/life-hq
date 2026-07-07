const fs = require("fs");
const css = fs.readFileSync("src/index.css", "utf8");

const utilities = `
/* DASHBOARD UTILITIES */
.card-interactive{transition:border-color .15s ease,transform .15s ease,box-shadow .15s ease;border:1px solid var(--border)}
.card-interactive:hover{border-color:rgba(180,0,0,0.4);transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,0.3)}
.card-interactive:active{transform:translateY(0)}
.metric-tile{display:flex;flex-direction:column;gap:.25rem;padding:1rem;border-radius:0;border:1px solid var(--border);background:var(--card)}
.metric-value{font-size:1.5rem;font-weight:800;line-height:1}
.metric-label{font-size:.6875rem;text-transform:uppercase;letter-spacing:.05em;color:#71717a;display:flex;align-items:center;gap:.375rem}
.btn-press{transition:transform .1s ease}
.btn-press:active{transform:scale(.97)}
.skeleton-shimmer{background:linear-gradient(90deg,var(--muted) 0%,color-mix(in srgb,var(--ring) 5%,var(--muted)) 50%,var(--muted) 100%);background-size:200% 100%;animation:shimmer 1.5s infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.stagger>*{animation:fade-in-up .3s ease-out both}
.stagger>:nth-child(1){animation-delay:0s}
.stagger>:nth-child(2){animation-delay:.05s}
.stagger>:nth-child(3){animation-delay:.1s}
.stagger>:nth-child(4){animation-delay:.15s}
.stagger>:nth-child(5){animation-delay:.2s}
.stagger>:nth-child(6){animation-delay:.25s}
.stagger>:nth-child(7){animation-delay:.3s}
.stagger>:nth-child(8){animation-delay:.35s}
`;

fs.writeFileSync("src/index.css", css + "\n" + utilities, "utf8");
console.log("Dashboard utilities added");
