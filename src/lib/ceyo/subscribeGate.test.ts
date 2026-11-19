import { describe, expect, it } from "vitest";
import { gateState, subscribeGatePrompt } from "./subscribeGate";
import { SEO_PAGES } from "@/data/seoPages";
import { landingRedirect } from "@/config/domains";

describe("subscribe gate", () => {
  it("no trial started reads as no_trial", () => expect(gateState({ trialUsed: false, trialActive: false, isPaid: false })).toBe("no_trial"));
  it("ended trial reads as trial_ended", () => expect(gateState({ trialUsed: true, trialActive: false, isPaid: false })).toBe("trial_ended"));
  it("prompt forbids executing tasks", () => expect(subscribeGatePrompt({ trialUsed: false, trialActive: false, isPaid: false })).toMatch(/Do NOT carry out/));
});
describe("seo pages", () => {
  it("has at least 20 unique pages", () => { expect(SEO_PAGES.length).toBeGreaterThanOrEqual(20); expect(new Set(SEO_PAGES.map((p) => p.slug)).size).toBe(SEO_PAGES.length); });
  it("pricing stays on the marketer landing host", () => expect(landingRedirect("matra.ceyo.app", "/pricing")).toBeNull());
});
