import { NextResponse, type NextRequest } from 'next/server';

import { bootstrapProfile } from '@/features/auth/bootstrap-profile';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const timezone = searchParams.get('tz') ?? 'UTC';

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/sign-in?error=exchange_failed`);
  }

  const { user } = data;
  await bootstrapProfile(supabase, {
    userId: user.id,
    displayName:
      user.user_metadata.full_name ?? user.user_metadata.name ?? user.email?.split('@')[0] ?? 'You',
    avatarUrl: user.user_metadata.avatar_url ?? null,
    timezone,
  });

  return NextResponse.redirect(origin);
}
