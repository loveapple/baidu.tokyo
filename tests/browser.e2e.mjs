// Run after a production build. All network requests are fulfilled locally.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const browser = await chromium.launch({ headless: true,
  ...(process.env.BROWSER_EXECUTABLE ? {executablePath: process.env.BROWSER_EXECUTABLE} : {}) });
try {
  for (const automated of [true, false]) {
    const context = await browser.newContext();
    const calls = [], tags = [];
    await context.exposeBinding("captureGA", (_source, args) => calls.push(args));
    await context.addInitScript(({automated}) => {
      Object.defineProperty(navigator, "webdriver", {get: () => automated});
      window.dataLayer = [];
      window.dataLayer.push = (...items) => { items.forEach(item => window.captureGA([...item])); return Array.prototype.push.apply(window.dataLayer, items); };
    }, {automated});
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      if (url.hostname === "www.googletagmanager.com") {
        tags.push(url.href); return route.fulfill({body:"",contentType:"text/javascript"});
      }
      if (url.hostname !== "baidu.tokyo") return route.fulfill({body:"External navigation preserved"});
      let path = decodeURIComponent(url.pathname);
      if (path.endsWith("/")) path += "index.html";
      const file = resolve("dist", `.${path}`);
      assert.ok(file.startsWith(resolve("dist") + "/") || file.startsWith(resolve("dist") + "\\"));
      const types = {html:"text/html", mjs:"text/javascript", css:"text/css", svg:"image/svg+xml", png:"image/png", jpg:"image/jpeg"};
      try { await route.fulfill({body:await readFile(file),contentType:types[path.split(".").pop()] || "text/plain"}); }
      catch { await route.fulfill({status:404,body:"Missing local asset"}); }
    });
    const page = await context.newPage();
    for (const width of [1280,390]) {
      await page.setViewportSize({width,height:900});
      for (const path of ["/", "/operator/", "/privacy/", "/contact/", "/philosophy/"]) {
        const failures = [];
        const onResponse = r => { if(r.status() >= 400) failures.push(r.url()); };
        page.on("response", onResponse);
        await page.goto(`https://baidu.tokyo${path}`);
        await page.waitForLoadState("networkidle");
        assert.deepEqual(failures, []);
        assert.equal(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.equal(await page.locator("h1").count(), 1);
        assert.ok(await page.locator("footer").innerText().then(t => t.includes("運営：happinesea")));
        if (!automated) await page.screenshot({path:`.qa/analytics-${path === "/" ? "home" : path.split("/")[1]}-${width}.png`,fullPage:true});
        page.off("response", onResponse);
      }
    }
    if (automated) { assert.equal(tags.length,0); assert.equal(calls.length,0); }
    else {
      for (const kind of ["click","keyboard","middle","ctrl"]) {
        await page.goto("https://baidu.tokyo/");
        await page.waitForLoadState("networkidle");
        const before = calls.filter(c => c[0] === "event").length;
        const link = page.locator("a[data-amazon-book]").first();
        if(kind === "keyboard") { await link.focus(); await page.keyboard.press("Enter"); }
        else await link.click(kind === "middle" ? {button:"middle"} : kind === "ctrl" ? {modifiers:["Control"]} : {});
        await page.waitForTimeout(100);
        assert.equal(calls.filter(c => c[0] === "event" && c[1] === "amazon_1").length, before+1);
        if(kind === "click" || kind === "keyboard") assert.equal(page.url(), "https://link.amazon/B0fDC1J7c");
      }
      assert.equal(calls.filter(c => c[0] === "config").length, tags.length);
      await page.goto("https://baidu.tokyo/");
      await page.waitForLoadState("networkidle");
      const before = calls.filter(c => c[0] === "event").length;
      await page.evaluate(() => {
        const link = document.createElement("a");
        link.href = "https://www.amazon.co.jp/dp/B0HB34S81L";
        link.dataset.amazonBook = "脱依存の経済学";
        link.textContent = "追加された書籍リンク";
        document.querySelector("main").append(link);
      });
      await page.getByText("追加された書籍リンク", {exact:true}).click();
      await page.waitForTimeout(100);
      assert.equal(calls.filter(c => c[0] === "event").length, before+1);
    }
    await context.close();
  }
  console.log("E2E PASS: 5 pages x 2 viewports, automated GA silent, simulated production click/keyboard/middle/ctrl once; no real external traffic");
} finally { await browser.close(); }
