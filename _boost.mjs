const fs = require("fs");
let css = fs.readFileSync("src/index.css", "utf8");
// Make section backgrounds 3x more visible
const map = {
  "#0c0808": "#1a0a0a",
  "#0d0808": "#1c0a0a",
  "#0d0a06": "#1c1006",
  "#0d0606": "#1a0606",
  "#08090c": "#0a0e18",
  "#0d080a": "#1a0a10",
  "#0a080c": "#100a18",
  "#090a0c": "#0e1018",
  "#0d0a08": "#1a1008",
  "#080c0c": "#0a1616",
  "#080a0c": "#0a1018",
  "#0a0a0a": "#0c0c0c",
  "#0d0a04": "#1a1004",
};
for (const [old, nw] of Object.entries(map)) {
  css = css.replace(new RegExp(old, "g"), nw);
}
fs.writeFileSync("src/index.css", css, "utf8");
console.log("Boosted section colors");
