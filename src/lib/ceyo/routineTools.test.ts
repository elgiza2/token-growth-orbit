import { describe, expect, it, vi } from "vitest";
import { workspaceTools } from "./workspaceTools.server";

describe("routine-capable bot tools", () => {
  it("exposes routine creation and real Telegram reads to every bot", () => {
    const tools = workspaceTools({
      db: {} as never,
      userId: "owner",
      botId: "bot",
      conversationId: "conversation",
      primary: false,
      emit: vi.fn(),
      signal: new AbortController().signal,
      poll: async () => [],
    });
    expect(tools.some((tool) => tool.name === "create_routine")).toBe(true);
    expect(tools.some((tool) => tool.name === "read_telegram_messages")).toBe(true);
  });
});
