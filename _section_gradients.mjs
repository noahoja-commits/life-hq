import { readFileSync, writeFileSync } from "fs";

let css = readFileSync("src/index.css", "utf8");

const gradients = [
  ["dashboard", "rgba(196,30,58,0.12)"],
  ["todos", "rgba(220,38,38,0.12)"],
  ["goals", "rgba(217,119,6,0.12)"],
  ["ventures", "rgba(153,27,27,0.14)"],
  ["money", "rgba(180,83,9,0.10)"],
  ["track", "rgba(59,130,246,0.08)"],
  ["calendar", "rgba(219,39,119,0.10)"],
  ["contacts", "rgba(126,34,206,0.08)"],
  ["hub", "rgba(100,116,139,0.06)"],
  ["pages", "rgba(146,64,14,0.10)"],
  ["applications", "rgba(20,184,166,0.08)"],
  ["routines", "rgba(3,105,161,0.08)"],
  ["focus", "rgba(107,33,168,0.12)"],
  ["review", "rgba(190,18,60,0.10)"],
  ["dates", "rgba(190,24,93,0.10)"],
  ["scripts", "rgba(180,83,9,0.10)"],
  ["files", "rgba(51,65,85,0.06)"],
  ["network", "rgba(29,78,216,0.08)"],
  ["ai", "rgba(185,28,28,0.15)"],
  ["chatbot", "rgba(185,28,28,0.15)"],
];

let block = "\n/* SECTION GRADIENTS */\n";
for (const [key, color] of gradients) {
  block += `[data-section="${key}"]{background:linear-gradient(180deg,${color} 0%,transparent 40%)!important}\n`;
}

css += block;
writeFileSync("src/index.css", css, "utf8");
console.log("Added section gradients for", gradients.length, "sections");
