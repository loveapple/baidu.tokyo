import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("philosophy preserves supplied manuscript and learning/future distinctions", () => {
  const source = readFileSync("src/pages/philosophy.astro", "utf8");
  const html = readFileSync("dist/philosophy/index.html", "utf8");
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.equal((html.match(/<h2[ >]/g) || []).length, 5);
  for (const [, text] of source.matchAll(/<(?:h1|h2|p)\b[^>]*>([^<]+)<\//g))
    assert.ok(html.includes(text), text);
  for (const text of ["卦象は未来の出来事を保証するものではありません。", "機能も検討しています。", "医療上の判断に代わるものでもありません。", "『脱依存経済学』などの著作活動を土台としながら"])
    assert.ok(html.includes(text));
  assert.match(html, /<title>燊然の考え方｜易と対話し、変化を考える<\/title>/);
  assert.ok(readFileSync("dist/sitemap-0.xml", "utf8").includes("/philosophy/</loc>"));
  const home = readFileSync("dist/index.html", "utf8");
  assert.match(home, /id="philosophy-title"/);
  assert.ok(home.includes("燊然の考え方を読む"));
});
