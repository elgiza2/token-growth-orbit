import { useEffect, useMemo, useRef, useState } from "react";
import { buildLandingHtml } from "./buildLanding";
import { detectLandingLang, type LandingLang } from "./landingContent";
import { webAppUrl } from "@/config/domains";
import { marketerCodeForHost, cleanRefCode } from "@/lib/referrals/rules";

const LANG_KEY = "ceyo-landing-lang";

/** Main landing page. Rendered inside an isolated frame so the app's dark theme never touches it. */
export default function CeyoLanding() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [lang, setLang] = useState<LandingLang>(() =>
    detectLandingLang(localStorage.getItem(LANG_KEY), new URLSearchParams(location.search).get("lang"), "en"),
  );

  const html = useMemo(() => buildLandingHtml({ lang, appLink: (p) => webAppUrl(location.host, location.origin, p) }), [lang]);

  useEffect(() => {
    // Count one visit per browser session on a marketer page.
    const code = marketerCodeForHost(location.host) ?? cleanRefCode(new URLSearchParams(location.search).get("ref"));
    if (!code || sessionStorage.getItem("ceyo_ref_visit")) return;
    sessionStorage.setItem("ceyo_ref_visit", "1");
    void fetch("/api/public/ref-visit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }), keepalive: true }).catch(() => undefined);
  }, []);

  useEffect(() => {
    document.title = lang === "ar" ? "Ceyo — روبوتاتك الشخصية ومجموعاتك" : "Ceyo — Your Personal Bots and Group Chats";
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      if (e.data?.type !== "ceyo-landing-language") return;
      const next: LandingLang = lang === "ar" ? "en" : "ar";
      localStorage.setItem(LANG_KEY, next);
      setLang(next);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [lang]);

  return <iframe key={lang} ref={frame} title="Ceyo" srcDoc={html} style={{ display: "block", width: "100%", height: "100dvh", border: 0 }} />;
}
