import { readFileSync, writeFileSync } from "fs";
let f = readFileSync("src/components/atomic-crm/layout/Layout.tsx", "utf8");
f = f.replace("import { useLocation } from 'react-router';\n", "");
f = f.replace(
  "  const location = useLocation();\n  const notify = useNotify();\n",
  "  const notify = useNotify();\n"
);
f = f.replace(
  'className="u-scroll min-h-0 flex-1 overflow-y-auto page-enter"',
  'className="u-scroll min-h-0 flex-1 overflow-y-auto"'
);
f = f.replace("          key={location.pathname}\n", "");
writeFileSync("src/components/atomic-crm/layout/Layout.tsx", f, "utf8");
console.log("fixed scroll");
