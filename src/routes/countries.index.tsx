import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/countries/")({
  server: { handlers: { GET: async ({ request }) => (await import("@/components/countries/serveCountry.server")).countriesIndexResponse(request) } },
});
