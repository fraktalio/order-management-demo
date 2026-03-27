import { createGitHubOAuthConfig, createHelpers } from "@deno/kv-oauth";

/** Creates the OAuth config from environment variables. */
export function createOAuthConfig() {
  const provider = Deno.env.get("OAUTH_PROVIDER") ?? "github";
  if (provider === "github") {
    return createGitHubOAuthConfig();
  }
  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

/** kv_oauth helpers: signIn, handleCallback, signOut, getSessionId */
export const { signIn, handleCallback, signOut, getSessionId } = createHelpers(
  createOAuthConfig(),
);
