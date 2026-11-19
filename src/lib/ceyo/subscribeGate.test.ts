import { describe, expect, it } from "vitest";
import { gateState, subscribeGatePrompt } from "./subscribeGate";
import { PAGE_LANGS, marketingPaths } from "@/components/landing/localePages";
import { COUNTRY_PAGES } from "@/components/countries/list";
import { landingRedirect } from "@/config/domains";

describe("subscribe gate", () => {
  it("no trial started reads as no_trial", () => expect(gateState({ trialUsed: false, trialActive: false, isPaid: false })).toBe("no_trial"));
  it("ended trial reads as trial_ended", () => expect(gateState({ trialUsed: true, trialActive: false, isPaid: false })).toBe("trial_ended"));
  it("prompt forbids executing tasks", () => expect(subscribeGatePrompt({ trialUsed: false, trialActive: false, isPaid: false })).toMatch(/Do NOT carry out/));
});
describe("locale pages", () => {
  it("covers 10 languages", () => expect(PAGE_LANGS.length).toBe(10));
  it("sitemap lists every language page and each country page once", () => expect(marketingPaths()).toHaveLength(3 + 30 + PAGE_LANGS.length * 2 + 1 + COUNTRY_PAGES.length));
  it("pricing and locale pages stay on the marketer landing host", () => { expect(landingRedirect("matra.ceyo.app", "/pricing")).toBeNull(); expect(landingRedirect("matra.ceyo.app", "/ar/eg")).toBeNull(); });
});
