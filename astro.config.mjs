import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://loveapple.github.io",
  base: "/baidu.tokyo",
  trailingSlash: "always",
  output: "static",
  integrations: [sitemap()],
});
