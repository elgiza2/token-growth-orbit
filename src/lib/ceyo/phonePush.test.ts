import { describe, expect, it } from "vitest";
import { PUSH_TEXT_LIMIT, PUSH_TOKEN_PATTERN, pushPayload } from "./phonePush";

describe("phone push payload", () => {
  it("keeps only same-app paths", () => {
    expect(pushPayload({ kind: "message", id: "a", botName: "B", text: "t", path: "//evil.example" }).path).toBe("/");
    expect(pushPayload({ kind: "message", id: "a", botName: "B", text: "t", path: "https://evil.example" }).path).toBe("/");
    expect(pushPayload({ kind: "message", id: "a", botName: "B", text: "t", path: "/?chat=bot%3A1" }).path).toBe("/?chat=bot%3A1");
  });
  it("caps the reply text at 1500 characters", () => {
    expect(PUSH_TEXT_LIMIT).toBe(1500);
    expect(pushPayload({ kind: "message", id: "a", botName: "B", text: "x".repeat(4000), path: "/" }).text).toHaveLength(1500);
  });
  it("rejects tokens with unexpected characters", () => {
    expect(PUSH_TOKEN_PATTERN.test("abc'); alert(1)//" + "x".repeat(20))).toBe(false);
    expect(PUSH_TOKEN_PATTERN.test("dGVzdA:APA91b" + "x".repeat(40))).toBe(true);
  });
});
