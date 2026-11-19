import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/zh/")({
  server: { handlers: { GET: async ({ request }) => (await import("@/components/landing/serveLanding.server")).landingResponse(request, { lang: "zh" }) } },
});
