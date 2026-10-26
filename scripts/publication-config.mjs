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
