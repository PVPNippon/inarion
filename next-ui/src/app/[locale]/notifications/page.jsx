/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
import { useTranslations } from 'next-intl'

/**
 * A placeholder component for the notifications page.
 *
 * @returns {JSX.Element} A JSX element with a heading and a paragraph that says
 * this is a placeholder for the notifications page.
 */
export default function Notifications() {
  const t = useTranslations('notifications')
  return (
    <div>
      <h2>{t('title')}</h2>
      <p>{t('description')}</p>
    </div>
  )
}
