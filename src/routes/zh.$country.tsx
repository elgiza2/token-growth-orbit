import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/zh/$country")({
  server: { handlers: { GET: async ({ request, params }) => (await import("@/components/landing/serveLanding.server")).localePageResponse(request, "zh", params.country) } },
});
