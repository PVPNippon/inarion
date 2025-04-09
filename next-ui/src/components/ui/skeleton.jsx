/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }) {
  return <div data-slot="skeleton" className={cn('bg-primary/10 animate-pulse rounded-md', className)} {...props} />
}

export { Skeleton }
