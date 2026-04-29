// lib/auth.ts — authentication helpers
// Replace mock implementations with real JWT / session logic

export type Role = "student" | "admin";

export interface AuthUser {
  id: string;
  identifier: string; // name or email
  role: Role;
}

/** Verify a token and return the decoded user, or null if invalid */
export async function verifyToken(_token: string): Promise<AuthUser | null> {
  // TODO: verify JWT signature and decode payload
  return null;
}

/** Sign a token for a user */
export async function signToken(_user: AuthUser): Promise<string> {
  // TODO: sign JWT with secret from env
  return "mock-jwt-token";
}

/** Extract bearer token from Authorization header */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
