import { describe, expect, it } from "vitest";
import { cleanRefCode, marketerCodeForHost, marketerShare, resolveOperator } from "./rules";

const rows = [
  { username: "eigiza", role: "admin", marketer_code: null },
  { username: "raved01", role: "marketer", marketer_code: "matra" },
];

describe("referral rules", () => {
  it("matra.ceyo.app belongs to marketer matra", () => {
    expect(marketerCodeForHost("matra.ceyo.app")).toBe("matra");
    expect(marketerCodeForHost("ceyo.app")).toBeNull();
  });
  it("marketer gets 50% of each payment", () => {
    expect(marketerShare(300, 50)).toBe(150);
    expect(marketerShare(9.99, 50)).toBe(5);
  });
  it("only @eIgiza is admin", () => {
    expect(resolveOperator("eIgiza", rows)).toEqual({ role: "admin", code: null });
    expect(resolveOperator("@Raved01", rows)).toEqual({ role: "marketer", code: "matra" });
    expect(resolveOperator("someone", rows)).toBeNull();
    expect(resolveOperator(undefined, rows)).toBeNull();
  });
  it("rejects malformed referral codes", () => {
    expect(cleanRefCode("MATRA")).toBe("matra");
    expect(cleanRefCode("x';drop")).toBeNull();
  });
});
