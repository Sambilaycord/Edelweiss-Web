import type { Session } from '@supabase/supabase-js';

// True if the session was created by a password-recovery code/link rather than a normal login.
// Supabase records this in the access token's `amr` claim as { method: 'recovery' }.
export const isRecoverySession = (session: Session | null): boolean => {
  if (!session) return false;
  try {
    const payload = session.access_token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const amr: unknown = JSON.parse(json).amr;
    if (!Array.isArray(amr)) return false;
    return amr.some((entry) =>
      (typeof entry === 'string' ? entry : entry?.method) === 'recovery'
    );
  } catch {
    return false;
  }
};
