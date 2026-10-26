export function publicationConfig(mode = "staging") {
  if (!["staging", "production"].includes(mode))
    throw new Error(`Invalid PUBLICATION_MODE: ${mode}`);
  const production = mode === "production";
  const site = production
    ? "https://baidu.tokyo"
    : "https://loveapple.github.io";
  const base = production ? "/" : "/baidu.tokyo";
  return {
    mode,
    site,
    base,
    url: new URL(`${base.replace(/\/$/, "")}/`, site).href,
  };
}

export function publicationForPages(pages) {
  if (pages.build_type !== "workflow")
    throw new Error("Pages Source must be GitHub Actions");
  if (pages.cname !== null && pages.cname !== "baidu.tokyo")
    throw new Error("Unexpected Pages custom domain");
  const config = publicationConfig(
    pages.cname === null ? "staging" : "production",
  );
  // Pages advertises HTTP while Enforce HTTPS is disabled during certificate setup.
  const pendingHttps = config.mode === "production" &&
    pages.https_enforced === false && pages.html_url === "http://baidu.tokyo/";
  if (pages.html_url !== config.url && !pendingHttps)
    throw new Error("Pages URL does not match selected publication mode");
  return config;
}
