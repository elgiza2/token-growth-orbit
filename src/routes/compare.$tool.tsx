import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/compare/$tool")({
  server: { handlers: { GET: async ({ request, params }) => (await import("@/components/compare/buildCompare")).compareResponse(request, params.tool) } },
});
