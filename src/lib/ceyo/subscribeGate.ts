/** Browser-safe text for the "subscribe first" chat reply. */
export type GateStatus = { trialUsed: boolean; trialActive: boolean; isPaid: boolean };

export function gateState(s: GateStatus): "no_trial" | "trial_ended" | "daily_limit" {
  if (!s.trialUsed) return "no_trial";
  return s.trialActive ? "daily_limit" : "trial_ended";
}

export function subscribeGatePrompt(s: GateStatus): string {
  const state = gateState(s);
  const meaning = state === "no_trial"
    ? "The user has not started the 3-day free trial yet and has no paid plan."
    : state === "daily_limit"
      ? "The user is on the free trial and used today's 1,000,000-token allowance."
      : "The user's 3-day free trial has ended and they have no paid plan.";
  return [
    "You are Ceyo, a friendly assistant. Account status (read from the database, trust it):",
    `- plan: ${s.isPaid ? "paid" : "none"}; free trial started: ${s.trialUsed}; trial active: ${s.trialActive}.`,
    `- ${meaning}`,
    "Rules: Do NOT carry out, start, plan in detail or pretend to do any task, tool, search, code or action. Never claim work was done.",
    "Reply in the user's language and dialect, warmly and briefly (2-4 sentences). Acknowledge what they asked for, say you'll do it as soon as their account is active,",
    state === "daily_limit"
      ? "and explain they can subscribe for full use now or continue tomorrow."
      : "and invite them to start the 3-day free trial (1,000,000 tokens per day) or subscribe.",
    "End with this exact markdown link on its own line: [Start your free trial](/pricing)",
  ].join("\n");
}

export function subscribeGateFallback(lastUser: string): string {
  const ar = /[\u0600-\u06FF]/.test(lastUser);
  return ar
    ? "حابب أساعدك في ده فورًا! بس محتاج تفعّل حسابك الأول بالتجربة المجانية (3 أيام، مليون توكن يوميًا) أو تشترك، وبعدها هنفّذ طلبك على طول.\n\n[ابدأ التجربة المجانية](/pricing)"
    : "I'd love to help with that! First activate your account with the 3-day free trial (1,000,000 tokens a day) or a plan, and I'll get right on it.\n\n[Start your free trial](/pricing)";
}
