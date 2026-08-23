// @lovable.dev/vite-tanstack-config already includes the TanStack Start plugin stack.
// Keep the additional Vite options here focused on build compatibility.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      commonjsOptions: {
        ignoreTryAll: true,
      },
    },
    ssr: {
      // Keep the TanStack Start runtime in the SSR graph instead of letting
      // Rolldown externalize it through an incompatible CommonJS boundary.
      noExternal: ["@tanstack/start", "@tanstack/react-start"],
    },
  },
});
