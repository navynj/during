'use client';

import { useState } from 'react';

import { authCallbackUrl, TIMEZONE_COOKIE } from '@/lib/site';
import { createClient } from '@/lib/supabase/client';
import { detectTimezone } from '@/lib/time';

export function SignInButton() {
  const [pending, setPending] = useState(false);

  async function signIn(): Promise<void> {
    setPending(true);

    // Only the browser knows the author's zone, and the callback runs on the
    // server. Short-lived, lax so it survives the redirect back from Google.
    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(detectTimezone())}; path=/; max-age=600; samesite=lax`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authCallbackUrl() },
    });

    if (error) setPending(false);
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={pending}
      className="bg-main-900 rounded-full px-6 py-3 text-base font-medium text-white disabled:opacity-60"
    >
      {pending ? 'Opening Google…' : 'Continue with Google'}
    </button>
  );
}
