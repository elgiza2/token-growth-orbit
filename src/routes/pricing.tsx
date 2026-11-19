import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  server: { handlers: { GET: async ({ request }) => {
    const m = await import("@/components/landing/serveLanding.server");
    return m.landingResponse(request, { lang: m.langFromRequest(request), mode: "pricing" });
  } } },
});
