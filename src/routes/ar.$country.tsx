import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ar/$country")({
  server: { handlers: { GET: async ({ request, params }) => (await import("@/components/landing/serveLanding.server")).localePageResponse(request, "ar", params.country) } },
});
