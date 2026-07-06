import { readFileSync, writeFileSync } from "fs";
const f = readFileSync("src/components/atomic-crm/layout/Layout.tsx", "utf8");
const f2 = f
  .replace("page-enter ", "")
  .replace("import { useLocation } from 'react-router';\n", "")
  .replace("const location = useLocation();\n", "");
writeFileSync("src/components/atomic-crm/layout/Layout.tsx", f2, "utf8");
console.log("fixed: removed page-enter, useLocation");
