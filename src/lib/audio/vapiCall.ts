/**
 * @doc Live voice call through Vapi (one engine: hearing, thinking and speaking, with barge-in).
 * Uses the public key and the shared Ceyo assistant; per-call persona travels as variable values.
 * Nothing is written to the chat conversation here.
 */
import Vapi from "@vapi-ai/web";
import type { RealtimeCall, RealtimeCallOptions } from "./realtimeCall";

// Public (browser-safe) Vapi key and the configured Ceyo assistant.
export const VAPI_PUBLIC_KEY = "1ea17aca-3060-4163-94d0-ac204cf934fe";
export const VAPI_ASSISTANT_ID = "4c3c3384-2605-4953-a037-1c1c3f93642c";

export function vapiVariables(opts: Pick<RealtimeCallOptions, "agentName" | "agentPrompt" | "reason">) {
  const name = opts.agentName?.trim() || "Ceyo";
  return {
    agentName: name,
    agentPrompt: (opts.agentPrompt || "").slice(0, 6000),
    reason: opts.reason?.trim() || "The user opened a voice conversation.",
    greeting: opts.reason?.trim() ? `${name} here.` : "أهلاً، أنا معاك. أقدر أساعدك في إيه؟",
  };
}

export async function startVapiCall(opts: RealtimeCallOptions): Promise<RealtimeCall> {
  const vapi = new Vapi(VAPI_PUBLIC_KEY);
  let ended = false;
  const phase = (p: Parameters<RealtimeCallOptions["onPhase"]>[0]) => { if (!ended) opts.onPhase(p); };
  opts.onPhase("connecting");

  vapi.on("call-start", () => phase("listening"));
  vapi.on("speech-start", () => phase("speaking"));
  vapi.on("speech-end", () => phase("listening"));
  vapi.on("call-end", () => { if (!ended) { ended = true; opts.onError("Call ended."); } });
  vapi.on("error", (e: unknown) => {
    if (ended) return;
    const err = e as { error?: { message?: string; msg?: string }; message?: string };
    opts.onError(err?.error?.message || err?.error?.msg || err?.message || "Voice service error. Try again.");
  });
  vapi.on("message", (m: { type?: string; transcriptType?: string; role?: string; transcript?: string }) => {
    if (m?.type === "transcript" && m.transcriptType === "final" && m.transcript?.trim() && (m.role === "user" || m.role === "assistant")) {
      if (m.role === "user") phase("thinking");
      opts.onTurn?.({ role: m.role, text: m.transcript });
    }
  });

  await vapi.start(VAPI_ASSISTANT_ID, { variableValues: vapiVariables(opts) });

  return {
    async resumeAudio() { return true; },
    setMuted(next) { vapi.setMuted(next); },
    interrupt() { phase("listening"); },
    end() { if (ended) return; ended = true; try { vapi.stop(); } catch { /* stopped */ } },
  };
}
