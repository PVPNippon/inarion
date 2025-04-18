/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default function middleware(req) {
  const res = createMiddleware(routing)(req)

  // Force browser locale detection by removing stored locale cookie
  res.cookies.set('NEXT_LOCALE', '', { expires: new Date(0), path: '/' })

  return res
}

export const config = {
  matcher: ['/', '/(en|ja)/:path*'],
}
