import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pt/")({
  server: { handlers: { GET: async ({ request }) => (await import("@/components/landing/serveLanding.server")).landingResponse(request, { lang: "pt" }) } },
});
