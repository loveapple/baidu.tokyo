import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { publicationConfig } from "../scripts/publication-config.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const canonical = publicationConfig(process.env.PUBLICATION_MODE).url;
const base = new URL(canonical).pathname;

test("LP has Japanese landmarks and verified book identity", () => {
  const html = read("../dist/index.html");
  assert.match(html, /<html lang="ja"/);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
  for (const id of ["main", "books", "author", "iching"])
    assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /脱依存の経済学/);
  assert.match(html, /中国「去依附」から読む、日本の国益・円安・資源危機/);
  assert.match(html, /郝　春利/);
  assert.match(html, /経済・社会評論/);
  assert.match(html, /今後の執筆テーマ/);
  assert.match(html, /href="https:\/\/link.amazon\/B0fDC1J7c"/);
  assert.match(
    html,
    /href="https:\/\/www.amazon.co.jp\/stores\/author\/B08L4PG3P4\/about"/,
  );
  assert.match(html, /href="#main"/);
  assert.doesNotMatch(
    html,
    /\bLINE\b|AIエージェント|相談受付|2027年末|正式稼働|ニュース収集|会員登録|<form|<iframe|<script/i,
  );
});

test("SEO URLs, sitemap and robots agree on project Pages URL", () => {
  const html = read("../dist/index.html");
  assert.ok(html.includes(`rel="canonical" href="${canonical}"`));
  assert.ok(html.includes(`property="og:url" content="${canonical}"`));
  for (const field of [
    "description",
    "og:title",
    "og:description",
    "og:image",
    "og:image:alt",
    "og:locale",
    "twitter:card",
  ])
    assert.ok(html.includes(`"${field}"`));
  assert.ok(html.includes(`${canonical}images/ogp.png`));
  assert.ok(read("../dist/sitemap-0.xml").includes(`<loc>${canonical}</loc>`));
  assert.ok(
    read("../dist/robots.txt").includes(
      `Sitemap: ${canonical}sitemap-index.xml`,
    ),
  );
  assert.ok(!existsSync(new URL("../public/CNAME", import.meta.url)));
  assert.ok(!existsSync(new URL("../dist/CNAME", import.meta.url)));
  const marker = JSON.parse(read("../dist/publication.json"));
  assert.equal(marker.url, canonical);
  assert.equal(marker.mode, process.env.PUBLICATION_MODE || "staging");
  assert.match(marker.source_sha, /^[a-f0-9]{40}$/);
});

test("local assets and anchor destinations exist, images have alternatives and dimensions", () => {
  const html = read("../dist/index.html");
  for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]+)"/g)) {
    assert.ok(match[1].startsWith(base), match[1]);
    assert.ok(
      existsSync(
        new URL(`../dist/${match[1].slice(base.length)}`, import.meta.url),
      ),
      match[1],
    );
  }
  for (const [, id] of html.matchAll(/href="#([^"]+)"/g))
    assert.ok(html.includes(`id="${id}"`), id);
  for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(img, /alt="[^"]+"/);
    assert.match(img, /width="\d+"/);
    assert.match(img, /height="\d+"/);
  }
  const png = readFileSync(new URL("../dist/images/ogp.png", import.meta.url));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test("deploy requires main push or dispatch and PRs only run QA", () => {
  const workflow = read("../.github/workflows/deploy.yml");
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /contents: read/);
  assert.match(
    workflow,
    /github.event_name != 'pull_request' && github.ref == 'refs\/heads\/main'/,
  );
  assert.match(workflow, /needs: build/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /pages-deployment.mjs guard/);
  assert.match(workflow, /pages-deployment.mjs verify/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.doesNotMatch(workflow, /PAGES_DEPLOY_ENABLED/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /npm test/);
  assert.doesNotMatch(workflow, /enablement: true|pull_request_target/);
});
