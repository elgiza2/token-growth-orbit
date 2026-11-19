import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tr/$country")({
  server: { handlers: { GET: async ({ request, params }) => (await import("@/components/landing/serveLanding.server")).localePageResponse(request, "tr", params.country) } },
});
