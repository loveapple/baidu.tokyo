import assert from "node:assert/strict";
import test from "node:test";
import {
  publicationConfig,
  publicationForPages,
} from "../scripts/publication-config.mjs";
import { assertTarget, verifyFiles, verifyHttps } from "../scripts/pages-deployment.mjs";

const sha = "a".repeat(40);
const environment = { protection_rules: [{ type: "branch_policy" }] };
const pages = {
  build_type: "workflow",
  cname: null,
  html_url: "https://loveapple.github.io/baidu.tokyo/",
};

test("publication URLs default to staging; production and invalid input are explicit", () => {
  assert.equal(publicationConfig().url, pages.html_url);
  assert.deepEqual(publicationConfig("production"), {
    mode: "production",
    site: "https://baidu.tokyo",
    base: "/",
    url: "https://baidu.tokyo/",
  });
  assert.throws(() => publicationConfig("typo"));
});

test("deployment accepts matching main, Actions Pages and no additional approval", () => {
  assert.doesNotThrow(() =>
    assertTarget({
      config: publicationConfig(),
      pages,
      environment,
      sha,
      mainSha: sha,
      ref: "refs/heads/main",
    }),
  );
});

test("Pages selects staging or production from its exact configured target", () => {
  assert.equal(publicationForPages(pages).mode, "staging");
  assert.equal(
    publicationForPages({
      ...pages,
      cname: "baidu.tokyo",
      html_url: "https://baidu.tokyo/",
    }).mode,
    "production",
  );
  assert.throws(() =>
    publicationForPages({ ...pages, cname: "other.example" }),
  );
  assert.throws(() => publicationForPages({ ...pages, cname: "baidu.tokyo" }));
});

test("production deployment accepts only its custom domain and root URL", () => {
  assert.doesNotThrow(() =>
    assertTarget({
      config: publicationConfig("production"),
      pages: {
        ...pages,
        cname: "baidu.tokyo",
        html_url: "https://baidu.tokyo/",
      },
      environment,
      sha,
      mainSha: sha,
      ref: "refs/heads/main",
    }),
  );
});

for (const [name, change] of [
  [
    "custom domain with staging artifact",
    { pages: { ...pages, cname: "baidu.tokyo" } },
  ],
  [
    "unexpected Pages URL",
    { pages: { ...pages, html_url: "https://other.example/" } },
  ],
  ["legacy Pages source", { pages: { ...pages, build_type: "legacy" } }],
  ["stale SHA", { mainSha: "b".repeat(40) }],
  ["non-main dispatch", { ref: "refs/heads/feature" }],
  [
    "required reviewer",
    { environment: { protection_rules: [{ type: "required_reviewers" }] } },
  ],
  [
    "wait timer",
    { environment: { protection_rules: [{ type: "wait_timer" }] } },
  ],
  ["production at project Pages", { config: publicationConfig("production") }],
])
  test(`deployment rejects ${name}`, () => {
    assert.throws(() =>
      assertTarget({
        config: publicationConfig(),
        pages,
        environment,
        sha,
        mainSha: sha,
        ref: "refs/heads/main",
        ...change,
      }),
    );
  });

test("published files must exactly match artifact bytes without redirects", async () => {
  const files = new Map([
    ["index.html", Buffer.from("<html>LP</html>")],
    ["images/ding.svg", Buffer.from("<svg/>")],
  ]);
  await verifyFiles(
    pages.html_url,
    files,
    async (url) =>
      new Response(
        files.get(
          url.pathname.endsWith("ding.svg") ? "images/ding.svg" : "index.html",
        ),
      ),
  );
  await assert.rejects(
    verifyFiles(pages.html_url, files, async () => new Response("stale")),
  );
  await assert.rejects(
    verifyFiles(
      pages.html_url,
      files,
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "https://baidu.tokyo/" },
        }),
    ),
  );
  await assert.rejects(verifyFiles(pages.html_url, new Map()));
});

for (const [url, enforced, accepted] of [
  ["http://baidu.tokyo/", false, true],
  ["http://baidu.tokyo/", true, false],
  ["http://baidu.tokyo/", undefined, false],
  ["http://other.example/", false, false],
  ["http://baidu.tokyo/baidu.tokyo/", false, false],
  ["http://baidu.tokyo:8080/", false, false],
  ["https://baidu.tokyo/", true, true],
]) test(`certificate transition ${url} enforced=${enforced}`, () => {
  const check = () => assertTarget({
    config: publicationConfig("production"),
    pages: { build_type: "workflow", cname: "baidu.tokyo", html_url: url, https_enforced: enforced },
    environment, sha, mainSha: sha, ref: "refs/heads/main",
  });
  if (accepted) assert.doesNotThrow(check);
  else assert.throws(check);
});

test("HTTPS final status stays pending until enforced and fails on TLS or bytes", async () => {
  const config = publicationConfig("production");
  const files = new Map([["index.html", Buffer.from("LP")]]);
  const unexpectedFetch = () => { throw new Error("must not fetch pending HTTPS"); };
  assert.equal(await verifyHttps(config, { https_enforced: false }, files, unexpectedFetch), false);
  assert.equal(await verifyHttps(config, { https_enforced: true }, files, async url => {
    assert.equal(url.origin, "https://baidu.tokyo");
    return new Response("LP");
  }), true);
  await assert.rejects(verifyHttps(config, { https_enforced: true }, files, unexpectedFetch));
  await assert.rejects(verifyHttps(config, { https_enforced: true }, files, async () => new Response("stale")));
});
