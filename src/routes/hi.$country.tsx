import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/hi/$country")({
  server: { handlers: { GET: async ({ request, params }) => (await import("@/components/landing/serveLanding.server")).localePageResponse(request, "hi", params.country) } },
});
