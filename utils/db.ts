/// <reference lib="deno.unstable" />

export interface User {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
  email: string | null;
}

let _kv: Deno.Kv | null = null;

async function getKv(): Promise<Deno.Kv> {
  if (!_kv) {
    _kv = await Deno.openKv();
  }
  return _kv;
}

/** Get a user by their OAuth provider ID. */
export async function getUserById(id: string): Promise<User | null> {
  const kv = await getKv();
  const result = await kv.get<User>(["users", id]);
  return result.value;
}

/** Get a user by their session ID. */
export async function getUserBySession(
  sessionId: string,
): Promise<User | null> {
  const kv = await getKv();
  const result = await kv.get<User>(["users_by_session", sessionId]);
  return result.value;
}

/** Create or update a user record, indexed by both user ID and session ID. */
export async function createOrUpdateUser(
  user: User,
  sessionId: string,
): Promise<void> {
  const kv = await getKv();
  await kv
    .atomic()
    .set(["users", user.id], user)
    .set(["users_by_session", sessionId], user)
    .commit();
}

/** Delete the session-to-user mapping. */
export async function deleteSessionUser(sessionId: string): Promise<void> {
  const kv = await getKv();
  await kv.delete(["users_by_session", sessionId]);
}

export { getKv as kv };
