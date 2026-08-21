/* eslint-disable @typescript-eslint/no-require-imports */
const { createHmac } = require("node:crypto");
const { chromium } = require("playwright");

const baseUrl = process.env.ACTIVATION_BASE_URL || "http://127.0.0.1:3000";
const testerSecret = process.env.TESTER_SESSION_SECRET || "local-only-responsive-test-key";
const routes = ["/", "/coverage", "/practical", "/quality", "/learning", "/transfer", "/findings", "/actions", "/qualitative", "/readiness"];

function token(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({ iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, ...payload });
  return `${header}.${body}.${createHmac("sha256", testerSecret).update(`${header}.${body}`).digest("base64url")}`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      for (const route of routes) {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
        const state = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - window.innerWidth, heading: Boolean(document.querySelector("h1")), sample: Boolean(document.querySelector(".sample-banner")) }));
        if (state.overflow > 0 || !state.heading || !state.sample) throw new Error(`${viewport.name} ${route}: ${JSON.stringify(state)}`);
      }
      results.push({ viewport: viewport.name, routes: routes.length, horizontalOverflow: 0 });
      await page.close();
    }

    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.context().addCookies([{ name: "dec_tester_session", value: token({ aud: "dec-tester", tester_id: "T-04", display_name: "Tester A", courses: ["hrba", "pm"] }), url: baseUrl, httpOnly: true, sameSite: "Lax" }]);
    await page.goto(`${baseUrl}/my-findings`, { waitUntil: "networkidle" });
    const privateState = await page.evaluate(() => ({ cards: document.querySelectorAll(".tester-card").length, aggregateLeak: /readiness decision|aggregate ratings/i.test(document.querySelector("main")?.textContent || ""), links: [...document.querySelectorAll(".tester-review a")].map((item) => item.href), overflow: document.documentElement.scrollWidth - window.innerWidth }));
    if (privateState.cards !== 1 || privateState.aggregateLeak || privateState.overflow > 0 || privateState.links.length !== 2 || !privateState.links.every((link) => link.includes("d%5Btester_id%5D=T-04"))) throw new Error(`tester view: ${JSON.stringify(privateState)}`);
    await page.getByRole("button", { name: "Project Management" }).click();
    if (!await page.getByText("No findings in this view").isVisible()) throw new Error("tester empty state did not appear");
    results.push({ tester: "T-04", ownCards: privateState.cards, emptyState: true, reviewLinksPrefilled: true, aggregateLeak: false, horizontalOverflow: 0 });
    console.log(JSON.stringify({ status: "pass", results }));
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
