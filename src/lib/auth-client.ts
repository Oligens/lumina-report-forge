export type AuthMode = "google-neon" | "offline-local";

/**
 * Browser-safe auth helpers. The server decides whether Google/Neon is configured;
 * no secret is ever exposed to the browser.
 */
export async function getAuthStatus(): Promise<{ mode: AuthMode; configured: boolean }> {
  try {
    const response = await fetch("/api/auth/status", { credentials: "include" });
    if (!response.ok) return { mode: "offline-local", configured: false };
    return (await response.json()) as { mode: AuthMode; configured: boolean };
  } catch {
    return { mode: "offline-local", configured: false };
  }
}

export function startGoogleSignIn(callbackUrl = "/") {
  const callback = encodeURIComponent(callbackUrl);
  window.location.assign(`/api/auth/signin/google?callbackUrl=${callback}`);
}

export function startLocalGuestMode() {
  localStorage.setItem("scarwrite_auth_mode", "offline-local");
  localStorage.setItem("scarwrite_guest_role", "SUPER_ADMIN");
}
