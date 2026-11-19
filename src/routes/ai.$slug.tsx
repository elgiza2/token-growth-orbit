import { createFileRoute, notFound } from "@tanstack/react-router";
import { FeatureGrid, MarketingShell, PricingPlans, TrialNote } from "@/components/marketing/PricingPlans";
import { SEO_PAGES, seoPage } from "@/data/seoPages";

export const Route = createFileRoute("/ai/$slug")({
  loader: ({ params }) => {
    const page = seoPage(params.slug);
    if (!page) throw notFound();
    return page;
  },
  component: SeoLanding,
  notFoundComponent: () => <MarketingShell><h1 className="mk-h1">Page not found</h1><p className="mk-lead"><a href="/ai">See all guides</a></p></MarketingShell>,
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Unavailable — Ceyo" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: loaderData.title },
        { name: "description", content: loaderData.intro },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.intro },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/ai/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/ai/${params.slug}` }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Ceyo", applicationCategory: "BusinessApplication", operatingSystem: "Web, Android", description: loaderData.intro, offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: 20, highPrice: 120 } }) }],
    };
  },
});

function SeoLanding() {
  const page = Route.useLoaderData();
  const related = SEO_PAGES.filter((p) => p.slug !== page.slug && p.kind === page.kind).slice(0, 8);
  return (
    <MarketingShell>
      <h1 className="mk-h1">{page.h1}</h1>
      <p className="mk-lead">{page.intro}</p>
      <div className="mk-feats">{page.points.map((x) => <div key={x} className="mk-feat"><b>{x}</b></div>)}</div>
      <h2 className="mk-h2">Plans</h2>
      <TrialNote />
      <PricingPlans />
      <h2 className="mk-h2">Everything Ceyo does</h2>
      <FeatureGrid />
      <h2 className="mk-h2">Related</h2>
      <div className="mk-links">{related.map((p) => <a key={p.slug} href={`/ai/${p.slug}`}>{p.h1}</a>)}</div>
    </MarketingShell>
  );
}
