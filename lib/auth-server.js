import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { getSupabaseAdmin } from './supabase/admin';

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_REQUESTS_PER_HOUR = 5;

export function getBearerToken(request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export async function getAuthenticatedUser(request) {
  const admin = getSupabaseAdmin();
  const token = getBearerToken(request);
  if (!admin || !token) return { admin, user: null };

  const { data, error } = await admin.auth.getUser(token);
  return { admin, user: error ? null : data.user };
}

export function createOtp() {
  return String(randomInt(100000, 1000000));
}

export function hashOtp(code) {
  const secret = process.env.OTP_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('OTP_HASH_SECRET is not configured');
  return createHmac('sha256', secret).update(code).digest('hex');
}

export function hashesMatch(left, right) {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function sendOtpEmail({ email, code }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Email delivery is not configured');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your Potohar Real Estates verification code',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Verify your Potohar Real Estates account</h2><p>Your one-time verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in ${OTP_EXPIRY_MINUTES} minutes and can only be used once.</p></div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email delivery failed: ${detail.slice(0, 200)}`);
  }
}

export function internalError(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function requestFingerprint(request, userId) {
  const forwarded = request.headers.get('x-forwarded-for') || 'unknown';
  return createHash('sha256').update(`${userId}:${forwarded}`).digest('hex');
}
