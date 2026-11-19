import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/fr/$country")({
  server: { handlers: { GET: async ({ request, params }) => (await import("@/components/landing/serveLanding.server")).localePageResponse(request, "fr", params.country) } },
});
