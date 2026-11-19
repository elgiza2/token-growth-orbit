import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing/PricingPlans";
import { SEO_PAGES } from "@/data/seoPages";

export const Route = createFileRoute("/ai/")({
  component: AiIndex,
  head: () => ({
    meta: [
      { title: "AI bots guides by city and use case — Ceyo" },
      { name: "description", content: "Explore how Ceyo personal AI bots work in your city and for Telegram, coding, research, automation and more." },
      { property: "og:title", content: "AI bots guides by city and use case — Ceyo" },
      { property: "og:description", content: "Ceyo personal bots for every city and every job: Telegram, web browsing, coding, research and routines." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/ai" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/ai" }],
  }),
});

function AiIndex() {
  return (
    <MarketingShell>
      <h1 className="mk-h1">Ceyo for every city and every job</h1>
      <h2 className="mk-h2">By use case</h2>
      <div className="mk-links">{SEO_PAGES.filter((p) => p.kind === "use").map((p) => <a key={p.slug} href={`/ai/${p.slug}`}>{p.h1}</a>)}</div>
      <h2 className="mk-h2">By city</h2>
      <div className="mk-links">{SEO_PAGES.filter((p) => p.kind === "geo").map((p) => <a key={p.slug} href={`/ai/${p.slug}`}>{p.title.split(" — ")[0]}</a>)}</div>
    </MarketingShell>
  );
}
