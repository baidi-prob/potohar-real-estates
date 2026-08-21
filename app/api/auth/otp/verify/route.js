import {
  getAuthenticatedUser,
  hashOtp,
  hashesMatch,
  internalError,
  json,
  OTP_MAX_ATTEMPTS,
} from '../../../../../lib/auth-server';

export const runtime = 'nodejs';

export async function POST(request) {
  const { admin, user } = await getAuthenticatedUser(request);
  if (!admin) return json({ error: 'Authentication server is not configured.' }, 503);
  if (!user) return json({ error: 'Please sign in before verifying your account.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const code = String(body?.code || '').replace(/\D/g, '');
  if (code.length !== 6) return json({ error: 'Enter the 6-digit verification code.' }, 400);

  try {
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (profile?.is_verified) return json({ verified: true });

    const { data: token, error: tokenError } = await admin
      .from('email_verification_codes')
      .select('id, code_hash, expires_at, attempts')
      .eq('user_id', user.id)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tokenError) throw tokenError;

    if (!token || new Date(token.expires_at).getTime() <= Date.now()) {
      return json({ error: 'That code has expired. Request a new one.' }, 400);
    }
    if (token.attempts >= OTP_MAX_ATTEMPTS) {
      return json({ error: 'Too many incorrect attempts. Request a new code.' }, 429);
    }

    await admin
      .from('email_verification_codes')
      .update({ attempts: token.attempts + 1 })
      .eq('id', token.id);

    if (!hashesMatch(hashOtp(code), token.code_hash)) {
      return json({ error: 'That code is incorrect.' }, 400);
    }

    const { error: consumeError } = await admin
      .from('email_verification_codes')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', token.id)
      .is('consumed_at', null);
    if (consumeError) throw consumeError;

    const { error: verifyError } = await admin
      .from('profiles')
      .update({ is_verified: true, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (verifyError) throw verifyError;

    return json({ verified: true });
  } catch (error) {
    console.error('OTP verification failed:', error);
    return internalError('Could not verify the code. Please try again.');
  }
}
