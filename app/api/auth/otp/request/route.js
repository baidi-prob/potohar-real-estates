import {
  createOtp,
  getAuthenticatedUser,
  hashOtp,
  internalError,
  json,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_REQUESTS_PER_HOUR,
  OTP_RESEND_SECONDS,
  sendOtpEmail,
} from '../../../../../lib/auth-server';

export const runtime = 'nodejs';

export async function POST(request) {
  const { admin, user } = await getAuthenticatedUser(request);
  if (!admin) return json({ error: 'Authentication server is not configured.' }, 503);
  if (!user) return json({ error: 'Please sign in before requesting a verification code.' }, 401);

  try {
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('email, is_verified')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    if (profile?.is_verified) return json({ verified: true });

    const { data: recentCodes, error: recentError } = await admin
      .from('email_verification_codes')
      .select('created_at, last_sent_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    if (recentError) throw recentError;

    if ((recentCodes || []).length >= OTP_MAX_REQUESTS_PER_HOUR) {
      return json({ error: 'Too many verification codes requested. Try again later.' }, 429);
    }

    const latest = recentCodes?.[0];
    if (latest) {
      const secondsSinceLast = Math.floor((Date.now() - new Date(latest.last_sent_at).getTime()) / 1000);
      if (secondsSinceLast < OTP_RESEND_SECONDS) {
        return json({ error: `Please wait ${OTP_RESEND_SECONDS - secondsSinceLast} seconds before requesting another code.` }, 429);
      }
    }

    const code = createOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    const email = profile?.email || user.email;
    if (!email) return json({ error: 'Your account does not have an email address.' }, 400);

    const { data: inserted, error: insertError } = await admin
      .from('email_verification_codes')
      .insert({ user_id: user.id, code_hash: hashOtp(code), expires_at: expiresAt })
      .select('id')
      .single();
    if (insertError) throw insertError;

    try {
      await sendOtpEmail({ email, code });
    } catch (error) {
      await admin.from('email_verification_codes').delete().eq('id', inserted.id);
      throw error;
    }

    return json({ verified: false, email, expiresAt });
  } catch (error) {
    console.error('OTP request failed:', error);
    return internalError('Could not send a verification code. Please try again.');
  }
}
