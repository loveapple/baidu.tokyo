import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Read the actual SVG strokes, so a correct label cannot hide an incorrect glyph.
for (const file of ["ding.svg", "ogp.svg", "../favicon.svg"]) {
  test(`${file}: 火風鼎 has upper 離 and lower 巽, top to bottom`, () => {
    const svg = readFileSync(new URL(`../public/images/${file}`, import.meta.url), "utf8");
    const group = svg.match(/<g\b[^>]*id="ding"[^>]*>([\s\S]*?)<\/g>/)?.[1];
    assert.ok(group, "six-line diagram must be identifiable");
    const rows = [...group.matchAll(/<path d="([^"]+)"/g)].map(([, d]) =>
      [...d.matchAll(/M([\d.]+) ([\d.]+)H([\d.]+)/g)].map(([, x1, y, x2]) =>
        [Number(x1), Number(y), Number(x2)]),
    );
    assert.equal(rows.length, 6);
    const left = rows[0][0][0];
    const right = rows[0][0][2];
    const actual = rows.map((row, index) => {
      assert.ok(row.length === 1 || row.length === 2);
      assert.equal(row[0][0], left);
      assert.equal(row.at(-1)[2], right);
      if (index) assert.ok(row[0][1] > rows[index - 1][0][1], "top-to-bottom order");
      if (row.length === 2) {
        assert.equal(row[0][1], row[1][1]);
        assert.ok(row[0][2] < row[1][0], "yin has a central gap");
        assert.equal(row[0][2] - left, right - row[1][0], "equal yin halves");
      }
      return row.length === 1 ? "陽" : "陰";
    });
    assert.deepEqual(actual.slice(0, 3), ["陽", "陰", "陽"], "☲ 離（火）");
    assert.deepEqual(actual.slice(3), ["陽", "陽", "陰"], "☴ 巽（風・木）");
    assert.match(svg, /火風鼎/);
    assert.match(svg, /木生火/);
  });
}

test("LP uses the reusable six-line SVG instead of independent CSS strokes", () => {
  const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
  assert.match(html, /src="\/baidu.tokyo\/images\/ding.svg"/);
  assert.doesNotMatch(html, /class="broken"/);
});
