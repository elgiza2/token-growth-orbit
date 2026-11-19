import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runAgentLoop: vi.fn(),
  workspaceTools: vi.fn(),
  settleRoutineRun: vi.fn(),
  sendPhonePush: vi.fn(),
}));

vi.mock("./agentLoop.server", () => ({ runAgentLoop: mocks.runAgentLoop }));
vi.mock("./workspaceTools.server", () => ({ workspaceTools: mocks.workspaceTools }));
vi.mock("./routineSettlement.server", () => ({ settleRoutineRun: mocks.settleRoutineRun }));
vi.mock("./phonePush.server", () => ({ sendPhonePush: mocks.sendPhonePush }));

import { executeRoutine, scheduledRoutinePrompt, type DueRoutine } from "./routines.server";

function query(result: unknown) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order"]) chain[method] = vi.fn(() => chain);
  chain.limit = vi.fn(async () => result);
  chain.single = vi.fn(async () => result);
  chain.maybeSingle = vi.fn(async () => result);
  return chain;
}

function database() {
  return {
    from: vi.fn((table: string) => {
      if (table === "conversations") return query({ data: { id: "conversation", bot_id: "bot" }, error: null });
      if (table === "agent_memories") return query({ data: [], error: null });
      if (table === "bots") return query({ data: { name: "المساعد", instructions: "اختصار الرسائل" }, error: null });
      throw new Error(`Unexpected table ${table}`);
    }),
  } as never;
}

const routine: DueRoutine = {
  id: "routine",
  user_id: "owner",
  conversation_id: "conversation",
  title: "ملخص تيليجرام",
  goal: "اقرأ الرسائل الجديدة في تيليجرام المرتبط كل 5 دقائق ولخصها لي",
  interval_minutes: 5,
  interval_hours: 24,
  next_run_at: "2026-11-18T12:40:00.000Z",
};

describe("automatic routine execution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runAgentLoop.mockResolvedValue("لخصت الرسائل الجديدة.");
    mocks.workspaceTools.mockReturnValue([{ name: "read_telegram_messages", def: {}, run: vi.fn() }]);
    mocks.settleRoutineRun.mockResolvedValue(undefined);
    mocks.sendPhonePush.mockResolvedValue(1);
  });

  it("tells the agent the schedule already fired and forbids duplicate scheduling", () => {
    const prompt = scheduledRoutinePrompt({ botName: "المساعد", instructions: "", title: routine.title, scheduledAt: routine.next_run_at, memory: [] });
    expect(prompt).toContain("ALREADY been triggered");
    expect(prompt).toContain("perform NOW, not a request to create");
    expect(prompt).toContain("Do NOT call create_routine");
    expect(prompt).toContain("call read_telegram_messages");
  });

  it("gives the scheduled run the interactive workspace tools and executes the saved goal", async () => {
    const status = await executeRoutine(database(), routine, "run");
    expect(status).toBe("completed");
    const tools = mocks.workspaceTools.mock.results[0].value;
    const options = mocks.runAgentLoop.mock.calls[0][5];
    expect(options.extras).toBe(tools);
    expect(options.chatModel).toBe(true);
    expect(mocks.runAgentLoop.mock.calls[0][1]).toEqual([{ role: "user", content: routine.goal }]);
    expect(mocks.workspaceTools.mock.calls[0][0]).toMatchObject({ userId: "owner", botId: "bot", conversationId: "conversation" });
  });

  it("sends the phone notification only after the reply and next occurrence are saved", async () => {
    await executeRoutine(database(), routine, "run");
    expect(mocks.settleRoutineRun).toHaveBeenCalledBefore(mocks.sendPhonePush);
    expect(mocks.sendPhonePush).toHaveBeenCalledExactlyOnceWith("owner", expect.objectContaining({ id: "run", botName: "المساعد", text: "ملخص تيليجرام\n\nلخصت الرسائل الجديدة." }));
  });

  it("does not announce successful completion when the run is waiting for sign-in", async () => {
    mocks.runAgentLoop.mockImplementation(async (_system, _history, emit) => {
      emit({ id: "login", type: "agent.tool_result", part: { tool_name: "browser", status: "ok", result: JSON.stringify({ type: "ceyo.browser_login" }) } });
      return "محتاج تسجيل الدخول الأول.";
    });
    await expect(executeRoutine(database(), routine, "run")).resolves.toBe("paused");
    expect(mocks.settleRoutineRun.mock.calls[0][5]).toBe(true);
    expect(mocks.sendPhonePush).not.toHaveBeenCalled();
  });

});
