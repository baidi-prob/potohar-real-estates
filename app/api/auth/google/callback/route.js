import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const callbackUrl = new URL('/auth/callback', requestUrl.origin);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (code) callbackUrl.searchParams.set('code', code);
  if (error) callbackUrl.searchParams.set('error', error);
  if (errorDescription) callbackUrl.searchParams.set('error_description', errorDescription);

  return NextResponse.redirect(callbackUrl);
}
