import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { publicationConfig } from "./scripts/publication-config.mjs";

const publication = publicationConfig(process.env.PUBLICATION_MODE);

export default defineConfig({
  site: publication.site,
  base: publication.base,
  trailingSlash: "always",
  output: "static",
  integrations: [
    sitemap(),
    {
      name: "publication-provenance",
      hooks: {
        "astro:build:done": async ({ dir }) => {
          const sha =
            process.env.GITHUB_SHA ||
            execFileSync("git", ["rev-parse", "HEAD"], {
              encoding: "utf8",
            }).trim();
          if (!/^[a-f0-9]{40}$/.test(sha))
            throw new Error("Invalid source SHA");
          await writeFile(
            new URL("publication.json", dir),
            JSON.stringify({
              mode: publication.mode,
              url: publication.url,
              source_sha: sha,
            }) + "\n",
          );
        },
      },
    },
  ],
});
