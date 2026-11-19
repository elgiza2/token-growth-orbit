/** Browser-safe push payload rules shared by the sender and its tests. FCM data values must be strings. */
export type PhonePush = { kind: "message"; id: string; botName: string; text: string; path: string };

export const PUSH_TEXT_LIMIT = 1500;

export function pushPayload(p: PhonePush): Record<string, string> {
  const path = p.path.startsWith("/") && !p.path.startsWith("//") ? p.path : "/";
  return { kind: p.kind, id: p.id.slice(0, 64), botName: p.botName.slice(0, 60), text: p.text.slice(0, PUSH_TEXT_LIMIT), path };
}

export const PUSH_TOKEN_PATTERN = /^[A-Za-z0-9_:\-]{20,4096}$/;
