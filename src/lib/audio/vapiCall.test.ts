import { describe, it, expect, vi } from "vitest";
vi.mock("@vapi-ai/web", () => ({ default: class {} }));
import { vapiVariables } from "./vapiCall";

describe("vapiVariables", () => {
  it("defaults the name to Ceyo", () => {
    expect(vapiVariables({ agentName: "", agentPrompt: "" }).agentName).toBe("Ceyo");
  });
  it("passes the call reason when the bot calls", () => {
    expect(vapiVariables({ agentName: "Sara", agentPrompt: "x", reason: "Bill due" }).reason).toBe("Bill due");
  });
});
