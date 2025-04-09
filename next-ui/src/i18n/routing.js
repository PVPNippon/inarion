/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  localeDetection: true, // This only works if the locale cookie is not set
})

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
