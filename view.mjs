// view.mjs — Reliable viewer with auth across page changes
import { chromium } from "playwright";
import { readFileSync, existsSync, mkdirSync } from "fs";

const token = readFileSync(".auth-token", "utf8").trim();
const auth = JSON.stringify({ access_token: token, refresh_token: "", expires_at: 9999999999 });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Intercept ALL page loads to inject auth
await context.addInitScript((t) => {
  localStorage.setItem("sb-ckmyquqccaridnloctgc-auth-token", t);
}, auth);

// Navigate to requested page
const path = process.argv[2] || "/";
const url = "https://atomic-crm-umber.vercel.app" + (path.startsWith("/") ? path : "/" + path);
await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
await page.waitForTimeout(3000);

const info = await page.evaluate(() => {
  const ds = document.querySelector("[data-section]");
  return {
    title: document.title,
    section: ds?.getAttribute("data-section") || "none",
    bg: ds ? getComputedStyle(ds).backgroundColor : getComputedStyle(document.body).backgroundColor,
    scroll: (() => { const m = document.querySelector("main"); return m ? `scrollH=${m.scrollHeight} clientH=${m.clientHeight}` : "no main"; })(),
  };
});

console.log(JSON.stringify(info, null, 2));
process.exit(0);
