import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/countries/$slug")({
  server: { handlers: { GET: async ({ request, params }) => (await import("@/components/countries/serveCountry.server")).countryPageResponse(request, params.slug) } },
});
