import { chromium } from "playwright";

const token = JSON.stringify({
  access_token: "eyJhbGciOiJFUzI1NiIsImtpZCI6ImNmMjY5MjJjLWFlYzMtNDg5MS04ZmE3LTc3NDAxNWI4NTRkZCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2NrbXlxdXFjY2FyaWRubG9jdGdjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJkMDBmYWYwNS05ZDRiLTQ3MjUtOGI2Mi0zNjRhMmY5ODk3OGYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgzMzM4NzM1LCJpYXQiOjE3ODMzMzUxMzUsImVtYWlsIjoibm9haG9qYTA3QGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJub2Fob2phMDdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcnN0X25hbWUiOiJOT0FIIiwibGFzdF9uYW1lIjoiT0pBIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJkMDBmYWYwNS05ZDRiLTQ3MjUtOGI2Mi0zNjRhMmY5ODk3OGYifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc4MzMzNTEzNX1dLCJzZXNzaW9uX2lkIjoiMWQ5YTBjNzEtNmYwMy00ZjYyLTkzMmItYzA5MDBhN2M5M2I4IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.bYF6SX8FtaPHweq26sAuLI3UkjjfA-rqX9iEfepBIGIRXlUArQmbRfa6xAe3uEonrUJjzj4nTklXEEdNFS8lNw",
  refresh_token: "",
  expires_at: 9999999999,
});

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Inject auth token via localStorage before page loads
  await page.goto("https://atomic-crm-umber.vercel.app", { waitUntil: "domcontentloaded" });
  await page.evaluate((t) => {
    localStorage.setItem("sb-ckmyquqccaridnloctgc-auth-token", t);
  }, JSON.stringify(token));

  // Navigate to dashboard — should stay logged in
  await page.goto("https://atomic-crm-umber.vercel.app", { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const ds = document.querySelector("[data-section]");
    return {
      title: document.title,
      url: location.href,
      section: ds?.getAttribute("data-section") || "none",
      bg: ds ? getComputedStyle(ds).backgroundColor : "no ds",
      bodyPreview: document.body.innerText.slice(0, 300),
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: "dash.png", fullPage: false });
  console.log("Screenshot saved");

  await browser.close();
})();
