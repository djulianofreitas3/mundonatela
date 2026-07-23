import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/device/register")({
  // Router handles server block for API routes
});

export const POST = async ({ request }: { request: Request }) => {
  // Logic here
  return new Response("OK");
}
