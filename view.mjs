// view.mjs — Open Life HQ in browser, take screenshots, extract text
// Usage: node view.mjs [/path] [/todos|/goals|/dashboard|etc]
import { chromium } from "playwright";
import { readFileSync } from "fs";

const token = JSON.stringify({
  access_token: readFileSync(".auth-token", "utf8").trim(),
  refresh_token: "",
  expires_at: 1783337672,
});

const page = process.argv[2] || "/";
const url = page.startsWith("http")
  ? page
  : "https://atomic-crm-umber.vercel.app" + (page.startsWith("/") ? page : "/" + page);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });

// Auth
await p.goto("https://atomic-crm-umber.vercel.app", { waitUntil: "networkidle" });
await p.evaluate((t) => {
  localStorage.setItem("sb-ckmyquqccaridnloctgc-auth-token", t);
}, token);
await p.waitForTimeout(500);

// Navigate
await p.goto(url, { waitUntil: "networkidle", timeout: 15000 });
await p.waitForTimeout(3000);

// Gather info
const info = await p.evaluate(() => {
  const ds = document.querySelector("[data-section]");
  const errors = [];
  // Check for console-like issues
  if (document.querySelector(".error")) errors.push("error class found");

  return {
    title: document.title,
    url: location.href,
    section: ds?.getAttribute("data-section") || "none",
    bg: ds ? getComputedStyle(ds).backgroundColor : getComputedStyle(document.body).backgroundColor,
    bodyText: document.body.innerText.slice(0, 500).replace(/\n\n+/g, "\n").trim(),
    mainScroll: document.querySelector("main")
      ? `scrollH=${document.querySelector("main").scrollHeight} clientH=${document.querySelector("main").clientHeight}`
      : "no main",
    errors,
  };
});

console.log(JSON.stringify(info, null, 2));

// Screenshot
const safeName = page.replace(/\//g, "_").replace(/[^a-zA-Z0-9_]/g, "") || "home";
const shotPath = `view_${safeName}.png`;
await p.screenshot({ path: shotPath, fullPage: false });
console.log(`Screenshot: ${shotPath}`);

await b.close();
