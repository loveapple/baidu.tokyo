// Only the exact production origin may load GA; automated browsers stay silent.
export function startAnalytics(win, doc, id, origin) {
  if (win.location.origin !== origin || win.navigator.webdriver ||
      win.navigator.globalPrivacyControl || win.navigator.doNotTrack === "1") return;
  if (win.__shinzenAnalytics) return;
  win.__shinzenAnalytics = true;
  win.dataLayer = win.dataLayer || [];
  win.gtag = function () { win.dataLayer.push(arguments); };
  win.gtag("js", new Date());
  // One config call owns the automatic page_view. Never forward query/hash or referrer.
  win.gtag("config", id, { page_location: origin + win.location.pathname,
    page_referrer: "", page_title: "燊然", send_page_view: true });
  const tag = doc.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  doc.head.append(tag);
  const track = event => {
    if (event.type === "auxclick" && event.button !== 1) return;
    if (event.type === "click" && event.button !== 0) return;
    const link = event.target.closest?.("a[data-amazon-book]");
    if (!link) return;
    let url;
    try { url = new URL(link.href); } catch { return; }
    // Explicit opt-in + exact Amazon hosts; never infer from arbitrary article text.
    if (url.protocol !== "https:" || !["link.amazon", "amzn.to", "amazon.co.jp", "www.amazon.co.jp", "amazon.com", "www.amazon.com"].includes(url.hostname)) return;
    win.gtag("event", "amazon_1", { amazon_domain: url.hostname,
      article_path: win.location.pathname });
  };
  doc.addEventListener("click", track);
  doc.addEventListener("auxclick", track);
}
if (typeof document !== "undefined") {
  const script = document.querySelector("script[data-measurement-id]");
  if (script) startAnalytics(window, document, script.dataset.measurementId, script.dataset.origin);
}
