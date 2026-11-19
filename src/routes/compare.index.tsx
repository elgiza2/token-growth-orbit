import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/compare/")({
  server: { handlers: { GET: async ({ request }) => (await import("@/components/compare/buildCompare")).compareResponse(request) } },
});
