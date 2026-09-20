import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/database.types';

/** Routes reachable without a session. Everything else redirects to sign-in. */
const PUBLIC_PATHS = ['/sign-in', '/auth/callback', '/auth/sign-out'];

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refreshes the session cookie. Must stay directly after createServerClient:
  // anything between the two can cause hard-to-debug random sign-outs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, searchParams } = request.nextUrl;

  // An OAuth code anywhere but the callback means Supabase did not accept the
  // redirect_to we sent and fell back to site_url. That failure is otherwise
  // silent — the guard below would bounce it to sign-in and it would read as
  // "nothing happened" — so name it instead.
  if (searchParams.has('code') && pathname !== '/auth/callback') {
    return NextResponse.redirect(errorUrl(request, 'redirect_not_allowlisted'));
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user && !isPublic) {
    return NextResponse.redirect(cleanUrl(request, '/sign-in'));
  }

  if (user && pathname === '/sign-in') {
    return NextResponse.redirect(cleanUrl(request, '/'));
  }

  return response;
}

/** Guard redirects drop the incoming query; carrying it forward only ever
 *  produced misleading URLs like /sign-in?code=… */
function cleanUrl(request: NextRequest, pathname: string): URL {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return url;
}

function errorUrl(request: NextRequest, reason: string): URL {
  const url = cleanUrl(request, '/sign-in');
  url.searchParams.set('error', reason);
  return url;
}
