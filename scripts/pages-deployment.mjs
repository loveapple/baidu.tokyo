import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import {
  publicationConfig,
  publicationForPages,
} from "./publication-config.mjs";

export function assertTarget({
  config,
  pages,
  environment,
  sha,
  mainSha,
  ref,
}) {
  assert.equal(ref, "refs/heads/main", "Deployment requires main");
  assert.match(sha ?? "", /^[a-f0-9]{40}$/, "Missing source SHA");
  assert.equal(sha, mainSha, "Source SHA must equal current main HEAD");
  assert.equal(
    pages.build_type,
    "workflow",
    "Set Pages Source to GitHub Actions",
  );
  assert.equal(
    pages.cname,
    config.mode === "staging" ? null : "baidu.tokyo",
    "Pages custom domain does not match artifact mode",
  );
  assert.deepEqual(publicationForPages(pages), config,
    "Pages target does not match artifact URL");
  assert.ok(
    Array.isArray(environment.protection_rules),
    "Cannot confirm environment protection",
  );
  assert.ok(
    environment.protection_rules.every((rule) => rule.type === "branch_policy"),
    "github-pages must not require additional approval or timers",
  );
}

async function api(path) {
  assert.ok(process.env.GH_TOKEN, "GH_TOKEN is required");
  const response = await fetch(
    `https://api.github.com/repos/loveapple/baidu.tokyo/${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    },
  );
  assert.equal(
    response.status,
    200,
    `Cannot read GitHub ${path}: ${response.status}`,
  );
  return response.json();
}

async function guard(config) {
  const [pages, main, environment] = await Promise.all([
    api("pages"),
    api("git/ref/heads/main"),
    api("environments/github-pages"),
  ]);
  assertTarget({
    config,
    pages,
    environment,
    sha: process.env.GITHUB_SHA,
    mainSha: main.object.sha,
    ref: process.env.GITHUB_REF,
  });
  const marker = JSON.parse(await readFile("dist/publication.json", "utf8"));
  assert.deepEqual(
    marker,
    { mode: config.mode, url: config.url, source_sha: process.env.GITHUB_SHA },
    "Artifact provenance mismatch",
  );
  console.log(`Verified target: ${config.url} SHA=${process.env.GITHUB_SHA}`);
  return pages;
}

export async function verifyFiles(baseUrl, files, fetcher = fetch) {
  assert.ok(files.size > 0, "No artifact files to verify");
  const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
  for (const [path, bytes] of files) {
    const url = new URL(path === "index.html" ? "" : path, baseUrl);
    url.searchParams.set("sha", process.env.GITHUB_SHA ?? hash(bytes));
    const response = await fetcher(url, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    assert.equal(
      response.status,
      200,
      `${url.pathname}: HTTP ${response.status}`,
    );
    assert.equal(
      hash(Buffer.from(await response.arrayBuffer())),
      hash(bytes),
      `${url.pathname}: published bytes differ from artifact`,
    );
  }
}

export async function verifyHttps(config, pages, files, fetcher = fetch) {
  if (pages.https_enforced !== true) return false;
  await verifyFiles(config.url, files, fetcher);
  return true;
}

async function verify(config) {
  const pages = await guard(config);
  assert.ok(
    [config.url, pages.html_url].includes(process.env.DEPLOYED_PAGE_URL),
    "Deployment action returned an unexpected URL",
  );
  const names = await readdir("dist", { recursive: true, withFileTypes: true });
  const files = new Map(
    await Promise.all(
      names
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const path = resolve(entry.parentPath, entry.name);
          const relative = path
            .slice(resolve("dist").length + 1)
            .replaceAll("\\", "/");
          return [relative, await readFile(path)];
        }),
    ),
  );
  for (let attempt = 1; ; attempt++) {
    try {
      await verifyFiles(pages.html_url, files);
      break;
    } catch (error) {
      if (attempt === 12) throw error;
      console.log(
        `Waiting for Pages propagation (${attempt}/12): ${error.message}`,
      );
      await delay(5000);
    }
  }
  const currentPages = await guard(config);
  const httpsReady = await verifyHttps(config, currentPages, files);
  const result = `Production/delivery verified: ${pages.html_url} SHA=${process.env.GITHUB_SHA}; ${files.size} files match artifact and main. HTTPS final verification: ${httpsReady ? "PASS" : "PENDING (enable Enforce HTTPS and rerun main workflow)"}`;
  console.log(result);
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${result}\n`);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  const command = process.argv[2];
  if (command === "select") {
    const qaOnly =
      process.env.GITHUB_EVENT_NAME === "pull_request" ||
      process.env.GITHUB_REF !== "refs/heads/main";
    const config = qaOnly
      ? publicationConfig()
      : publicationForPages(await api("pages"));
    await appendFile(
      process.env.GITHUB_OUTPUT,
      `mode=${config.mode}\nmodes=${JSON.stringify(qaOnly ? ["staging", "production"] : [config.mode])}\n`,
    );
    console.log(`Selected ${qaOnly ? "both modes for QA only" : config.mode}`);
  } else {
    const config = publicationConfig(process.env.PUBLICATION_MODE);
    assert.ok(
      ["guard", "verify"].includes(process.argv[2]),
      "Use guard or verify",
    );
    await (process.argv[2] === "guard" ? guard(config) : verify(config));
  }
}
