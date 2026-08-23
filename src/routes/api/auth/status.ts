import { createFileRoute } from "@tanstack/react-router";
import { isAuthConfigured } from "@/lib/auth";

export const Route = createFileRoute("/api/auth/status")({
  server: {
    handlers: {
      GET: async () => Response.json({
        configured: isAuthConfigured(),
        mode: isAuthConfigured() ? "google-neon" : "offline-local",
      }),
    },
  },
});
