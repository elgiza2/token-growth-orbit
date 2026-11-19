import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fr/")({
  server: { handlers: { GET: async ({ request }) => (await import("@/components/landing/serveLanding.server")).landingResponse(request, { lang: "fr" }) } },
});
