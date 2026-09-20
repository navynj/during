'use client';

import { useState } from 'react';

import { authCallbackUrl, TIMEZONE_COOKIE } from '@/lib/site';
import { createClient } from '@/lib/supabase/client';
import { detectTimezone } from '@/lib/time';

export function SignInButton() {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function signIn(): Promise<void> {
    setPending(true);
    setFailure(null);

    try {
      // Only the browser knows the author's zone, and the callback runs on the
      // server. Short-lived, lax so it survives the redirect back from Google.
      document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(detectTimezone())}; path=/; max-age=600; samesite=lax`;

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: authCallbackUrl() },
      });

      // A swallowed error here reads as "the button does nothing", which is
      // the hardest kind of failure to chase. Say it out loud instead.
      if (error) throw error;
    } catch (thrown) {
      const message = thrown instanceof Error ? thrown.message : String(thrown);
      console.error('[during] sign-in failed', thrown);
      setFailure(message);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="bg-main-900 rounded-full px-6 py-3 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Opening Google…' : 'Continue with Google'}
      </button>

      {failure ? (
        <p role="alert" className="text-pool-500 max-w-sm text-sm">
          {failure}
        </p>
      ) : null}
    </div>
  );
}
