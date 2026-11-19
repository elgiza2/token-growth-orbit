import { describe, expect, it } from "vitest";
import { DODO_ENABLED, methodsFor, providerFor } from "./regions";

describe("web payment regions", () => {
  it("Egypt uses Kashier with card and Vodafone Cash only", () => {
    expect(providerFor("EG")).toBe("kashier");
    expect(methodsFor("EG")).toEqual(["Card", "Vodafone Cash"]);
  });
  it("while Dodo is paused, every other country also pays through Kashier", () => {
    expect(DODO_ENABLED).toBe(false);
    expect(providerFor("US")).toBe("kashier");
    expect(providerFor("SA")).toBe("kashier");
    expect(methodsFor("IN")).toEqual(["Card", "Vodafone Cash"]);
  });
});
