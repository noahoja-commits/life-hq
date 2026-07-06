const { chromium } = require("playwright");
const token =
  '{"access_token":"eyJhbGciOiJFUzI1NiIsImtpZCI6ImNmMjY5MjJjLWFlYzMtNDg5MS04ZmE3LTc3NDAxNWI4NTRkZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2NrbXlxdXFjY2FyaWRubG9jdGdjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJkMDBmYWYwNS05ZDRiLTQ3MjUtOGI2Mi0zNjRhMmY5ODk3OGYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgzMzM3NjcyLCJpYXQiOjE3ODMzMzQwNzIsImVtYWlsIjoibm9haG9qYTA3QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJub2Fob2phMDdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcnN0X25hbWUiOiJOT0FIIiwibGFzdF9uYW1lIjoiT0pBIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJkMDBmYWYwNS05ZDRiLTQ3MjUtOGI2Mi0zNjRhMmY5ODk3OGYifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc4Mjk0OTE2NX1dLCJzZXNzaW9uX2lkIjoiNjljNGFiMTUtNDNjYi00OGMwLTg4MjAtZTFiZTEzNTYyNWEwIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.FYdEKB2mO_SuyGs7BKoF8Vaag6W2lDcu1udYXESx6LM-KHacCyHrtp0-Sy03yTYjDuOUDRF-DcHuEqS5myuvLw","refresh_token":"","expires_at":1783337672}';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("https://atomic-crm-umber.vercel.app", { waitUntil: "networkidle" });
  await page.evaluate((t) => { localStorage.setItem("sb-ckmyquqccaridnloctgc-auth-token", t); }, token);
  await page.goto("https://atomic-crm-umber.vercel.app", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(3000);

  for (const path of ["/", "/todos", "/goals", "/ventures"]) {
    try {
      await page.goto("https://atomic-crm-umber.vercel.app" + path, { waitUntil: "networkidle", timeout: 10000 });
      await page.waitForTimeout(2000);
      const bg = await page.evaluate(() => {
        const el = document.querySelector("[data-section]") || document.body;
        return getComputedStyle(el).backgroundColor;
      });
      console.log(path + ": bg=" + bg);
    } catch (e) { console.log(path + ": ERR " + e.message.slice(0, 60)); }
  }
  await browser.close();
  console.log("done");
})();
