import type { AuthService, ServiceResult } from '../../services/contracts';

function unavailable<T>(message: string): ServiceResult<T> {
  return { ok: false, error: { code: 'unavailable', message, recoverable: true } };
}

/** Preview-only adapter: it never stores credentials or creates a local/remote signed-in identity. */
export const localAuthAdapter: AuthService = {
  async signIn() {
    return unavailable('Email sign-in is not connected in this build. No account session was created.');
  },
  async signUp() {
    return unavailable('Email account creation is not connected in this build. No account was created.');
  },
  async signInWithGoogle() {
    return unavailable('Google sign-in is not configured in this build. No account was created.');
  },
  async verifyEmail() {
    return unavailable('Email verification is not connected in this build. No account session was created.');
  },
  async signOut() {
    return unavailable('There is no signed-in account in this local preview.');
  },
  async requestPasswordReset() {
    return unavailable('Password reset email is not connected in this build.');
  },
  async resendVerification() {
    return unavailable('Verification email is not connected in this build.');
  },
  async currentUser() {
    return { ok: true, value: null, source: 'local-preview' };
  },
};
