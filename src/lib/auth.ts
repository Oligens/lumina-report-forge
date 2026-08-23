import { Auth } from "@auth/core";
import Google from "@auth/core/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | undefined;

export function isAuthConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function getPrisma() {
  if (!process.env.DATABASE_URL) return undefined;
  prisma ??= new PrismaClient();
  return prisma;
}

export async function handleAuth(request: Request) {
  if (!isAuthConfigured()) {
    return new Response(JSON.stringify({
      ok: false,
      mode: "offline",
      message: "Google/Neon authentication is not configured; Offline/Guest Local remains available.",
    }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const client = getPrisma();
  if (!client) throw new Error("DATABASE_URL is required for persistent authentication.");

  return Auth(request, {
    trustHost: true,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(client),
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    session: { strategy: "database" },
    pages: { signIn: "/" },
  });
}
