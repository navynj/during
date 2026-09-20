'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import { detectTimezone } from '@/lib/time';

export function SignInButton() {
  const [pending, setPending] = useState(false);

  async function signIn(): Promise<void> {
    setPending(true);
    const supabase = createClient();

    // The browser knows the author's zone; the callback runs on the server and
    // does not, so it rides along and lands on the profile at bootstrap.
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('tz', detectTimezone());

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString() },
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
