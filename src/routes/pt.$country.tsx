import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pt/$country")({
  server: { handlers: { GET: async ({ request, params }) => (await import("@/components/landing/serveLanding.server")).localePageResponse(request, "pt", params.country) } },
});
