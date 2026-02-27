// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  // Only cache GET requests on API routes
  if (!req.nextUrl.pathname.startsWith('/api') || req.method !== 'GET') {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}