import { createFileRoute } from "@tanstack/react-router";
import { FeatureGrid, MarketingShell, PricingPlans, TrialNote } from "@/components/marketing/PricingPlans";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Ceyo personal AI bots" },
      { name: "description", content: "Ceyo plans: Plus, Pro and Ultra. Every plan starts with a 3-day free trial of personal bots that browse, code and work in the cloud." },
      { property: "og:title", content: "Pricing — Ceyo personal AI bots" },
      { property: "og:description", content: "Plus, Pro and Ultra plans with a 3-day free trial. Bots with their own cloud computer, browser, Telegram and 1,000+ apps." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
});

function PricingPage() {
  return (
    <MarketingShell>
      <h1 className="mk-h1">Pricing</h1>
      <p className="mk-lead">Bots that don't just chat — they browse, code and get work done on their own cloud computer, around the clock.</p>
      <TrialNote />
      <PricingPlans />
      <h2 className="mk-h2">What every plan includes</h2>
      <FeatureGrid />
    </MarketingShell>
  );
}
