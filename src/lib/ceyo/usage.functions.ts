import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import type { UsageStatus } from "./usage";
import { z } from "zod";
const statusSchema = z.object({ plan: z.string(), isPaid: z.boolean(), hasAccess: z.boolean().optional(), trialActive: z.boolean().optional(), trialEndsAt: z.string().nullable().optional(), trialUsed: z.boolean().optional(), tokensToday: z.number().nonnegative().optional(), tokenLimit: z.number().positive().optional(), allowanceUsd: z.number().nonnegative(), spentUsd: z.number().nonnegative(), remainingUsd: z.number().nonnegative(), stepUsd: z.number().positive() });
export const getUsageStatus = createServerFn({ method: "POST" }).handler(async (): Promise<UsageStatus> => {
  const { authenticate } = await import("./auth.server");
  const { db } = await authenticate(getRequest());
  setResponseHeader("Cache-Control", "no-store");
  const { data, error } = await db.rpc("agent_usage_status");
  if (error || !data) throw new Error("Could not load usage. Please try again.");
  const parsed = statusSchema.parse(data);
  const trialActive = parsed.trialActive === true;
  return { plan: parsed.plan, isPaid: parsed.isPaid, hasAccess: parsed.isPaid || (parsed.hasAccess === true && trialActive), trialActive, trialEndsAt: parsed.trialEndsAt ?? null, trialUsed: parsed.trialUsed !== false, tokensToday: parsed.tokensToday ?? 0, tokenLimit: parsed.tokenLimit ?? 1_000_000, allowanceUsd: parsed.allowanceUsd, spentUsd: parsed.spentUsd, remainingUsd: parsed.remainingUsd, stepUsd: parsed.stepUsd };
});