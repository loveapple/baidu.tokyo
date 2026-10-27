import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { startAnalytics } from "../public/analytics.mjs";
import { siteSettings, lineUrl } from "../src/config/site.mjs";

function fixture(origin = siteSettings.productionOrigin, navigator = {}) {
  const tags = [], listeners = {};
  const win = { location: { origin, pathname: "/", search: "?email=private" }, navigator };
  const doc = { createElement: () => ({}), head: { append: tag => tags.push(tag) },
    addEventListener: (type, callback) => { listeners[type] = callback; } };
  const start = () => startAnalytics(win, doc, siteSettings.measurementId, siteSettings.productionOrigin);
  return { win, tags, listeners, start };
}
test("production initializes once; local, staging, E2E and privacy signals stay silent", () => {
  const f = fixture(); f.start(); f.start();
  assert.equal(f.tags.length, 1);
  const calls = f.win.dataLayer.map(args => [...args]);
  assert.equal(calls.filter(a => a[0] === "config").length, 1);
  assert.equal(calls[1][1], siteSettings.measurementId);
  assert.equal(calls[1][2].page_location, "https://baidu.tokyo/");
  assert.equal(calls[1][2].page_referrer, "");
  for (const [origin, nav] of [["http://localhost:4321", {}], ["https://loveapple.github.io", {}], [siteSettings.productionOrigin, {webdriver:true}], [siteSettings.productionOrigin, {doNotTrack:"1"}], [siteSettings.productionOrigin, {globalPrivacyControl:true}]]) {
    const blocked = fixture(origin, nav); blocked.start(); assert.equal(blocked.tags.length, 0);
  }
});
test("delegated book clicks send once without cancelling navigation", () => {
  const f = fixture(); f.start();
  function click(href, marked = true, type = "click", button = 0) {
    f.listeners[type]({ type, button, target: { closest: () => marked ? {href} : null }, preventDefault: () => assert.fail("navigation cancelled") });
  }
  click("https://link.amazon/B0fDC1J7c");
  click("https://www.amazon.co.jp/dp/B0HB34S81L?tag=unchanged");
  click("https://amzn.to/example", true, "auxclick", 1);
  click("https://example.com/book"); click("https://amazon.co.jp.evil.example/book");
  click("https://www.amazon.co.jp/stores/author/author", false);
  click("https://link.amazon/B0fDC1J7c", true, "auxclick", 2);
  const events = f.win.dataLayer.map(a => [...a]).filter(a => a[0] === "event");
  assert.equal(events.length, 3);
  assert.ok(events.every(a => a[1] === "amazon_1"));
  assert.deepEqual(events[0][2], {amazon_domain:"link.amazon",article_path:"/"});
});
test("all pages share footer and production-only analytics", () => {
  const base = process.env.PUBLICATION_MODE === "production" ? "" : "/baidu.tokyo";
  const enabled = process.env.PUBLICATION_MODE === "production" && process.env.ANALYTICS_DISABLED !== "true";
  for (const path of ["index.html", "operator/index.html", "privacy/index.html", "contact/index.html"]) {
    const html = readFileSync(`dist/${path}`, "utf8");
    const route = path === "index.html" ? "/" : `/${path.split("/")[0]}/`;
    const origin = process.env.PUBLICATION_MODE === "production" ? "https://baidu.tokyo" : "https://loveapple.github.io";
    assert.ok(html.includes(`rel="canonical" href="${origin}${base}${route}"`));
    assert.equal((html.match(/data-measurement-id=/g) || []).length, enabled ? 1 : 0);
    if (enabled) assert.ok(html.includes(siteSettings.measurementId));
    for (const page of ["operator", "privacy", "contact"]) assert.ok(html.includes(`href="${base}/${page}/"`));
    assert.ok(html.includes(lineUrl));
    assert.ok(html.includes("© 2026 燊然 / 運営：happinesea"));
  }
});
