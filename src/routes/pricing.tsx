import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  server: { handlers: { GET: async ({ request }) => {
    const m = await import("@/components/landing/serveLanding.server");
    return m.landingResponse(request, { lang: "en", mode: "pricing" });
  } } },
});
