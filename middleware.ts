import { NextResponse, type NextRequest } from 'next/server'

// Lightweight route guard. When AUTH_PROTECT=true, it requires a Supabase session cookie.
export function middleware(request: NextRequest) {
  const protect = process.env.AUTH_PROTECT === 'true'
  if (!protect) return NextResponse.next()

  const { pathname } = request.nextUrl
  // Allow static files and auth pages
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/auth-setup' ||
    pathname === '/login' ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next()
  }

  // Supabase sets cookies starting with `sb:` or `supabase-`
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith('sb:') || c.name.startsWith('supabase-'))
  if (hasSession) return NextResponse.next()

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('redirectedFrom', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}


