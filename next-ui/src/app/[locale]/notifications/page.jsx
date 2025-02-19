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
