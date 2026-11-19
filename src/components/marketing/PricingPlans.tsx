import { useEffect, useState } from "react";
import { PLAN_PRICES, type BillingInterval, type Tier } from "@/lib/payments/plans";
import { webAppUrl } from "@/config/domains";
import "./marketing.css";

const PLANS: { tier: Tier; name: string; blurb: string; hi?: boolean; points: string[] }[] = [
  { tier: "plus", name: "Plus", blurb: "Your personal bots with their own cloud computer.", points: ["Unlimited personal bots", "Cloud computer and web browser", "Telegram bot and voice notes", "1,000+ app connections"] },
  { tier: "pro", name: "Pro", blurb: "More work at once for people who rely on their bots daily.", hi: true, points: ["Everything in Plus", "Higher usage for long tasks", "Group chats of specialist bots", "Scheduled routines and calls"] },
  { tier: "ultra", name: "Ultra", blurb: "The most usage for bots that never stop.", points: ["Everything in Pro", "Our highest usage allowance", "Heavy research and coding jobs", "Priority on new features"] },
];

export const FEATURES = [
  ["A computer for every bot", "Bots run code, open files and keep working in the cloud — even with your phone off."],
  ["Real web browsing", "They search and read real websites, and ask before signing in anywhere."],
  ["Telegram & voice", "Talk by voice or chat from Telegram with the same bot."],
  ["1,000+ apps", "Gmail, Sheets, Notion, Slack and more, with your approval."],
  ["Teams of bots", "Group specialists together and let a coordinator split the work."],
  ["Built-in wallet", "Hold and send crypto; bots can only propose, you confirm."],
] as const;

/** Link into the web app, keeping ?ref and adding the chosen plan. */
function signupHref(tier: Tier, interval: BillingInterval) {
  if (typeof window === "undefined") return `/auth?mode=signup&plan=${tier}&interval=${interval}`;
  const ref = new URLSearchParams(window.location.search).get("ref");
  const path = `/auth?mode=signup&plan=${tier}&interval=${interval}${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`;
  return webAppUrl(window.location.host, window.location.origin, path);
}

export function PricingPlans() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <>
      <div className="mk-toggle" role="group" aria-label="Billing period">
        <button type="button" aria-pressed={interval === "monthly"} onClick={() => setInterval("monthly")}>Monthly</button>
        <button type="button" aria-pressed={interval === "yearly"} onClick={() => setInterval("yearly")}>Yearly<span className="mk-save">save</span></button>
      </div>
      <div className="mk-plans">
        {PLANS.map((p) => {
          const yearly = PLAN_PRICES[p.tier].yearly;
          const useYearly = interval === "yearly" && typeof yearly === "number";
          const price = useYearly ? yearly : PLAN_PRICES[p.tier].monthly;
          return (
            <article key={p.tier} className={`mk-plan${p.hi ? " mk-plan--hi" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 22 }}>{p.name}</h3>
                {p.hi && <span className="mk-badge">Most popular</span>}
              </div>
              <div className="mk-price">${price}<small> / {useYearly ? "year" : "month"}</small></div>
              <div className="mk-muted">3-day free trial, then billed {useYearly ? "yearly" : "monthly"}</div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{p.blurb}</p>
              <a className={`mk-btn${p.hi ? " mk-btn--hi" : ""}`} href={signupHref(p.tier, useYearly ? "yearly" : "monthly")}>Start 3-day free trial</a>
              <ul className="mk-list">{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
            </article>
          );
        })}
      </div>
    </>
  );
}

export function FeatureGrid() {
  return <div className="mk-feats">{FEATURES.map(([t, d]) => <div key={t} className="mk-feat"><b>{t}</b><span className="mk-muted">{d}</span></div>)}</div>;
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mk">
      <nav className="mk-nav">
        <a href="/" className="mk-brand"><span className="mk-dot" aria-hidden />Ceyo</a>
        <a className="mk-btn" href="/pricing">Pricing</a>
      </nav>
      <main className="mk-wrap">{children}</main>
      <footer className="mk-foot"><a href="/ai">AI guides</a><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/subscription-terms">Subscription terms</a></footer>
    </div>
  );
}

export const TrialNote = () => (
  <div className="mk-trial">Try any plan free for 3 days — up to 1,000,000 tokens a day. Link a card to start; your plan is charged only when the trial ends, unless you cancel.</div>
);
