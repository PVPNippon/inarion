/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import { figtree } from './ui/fonts'
import '../app/globals.css'
import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({ children }) {
  return (
    <html>
      <body className={figtree.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
