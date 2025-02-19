'use client'
import { NextIntlClientProvider, useTranslations, useLocale } from 'next-intl'

/**
 * A placeholder component for the calendar page.
 *
 * @returns {JSX.Element} A JSX element with a heading and a paragraph that says
 * this is a placeholder for the calendar page.
 */
export default function Calendar() {
  const t = useTranslations('calendar')
  console.log('Translations for calendar:', t('title'))
  const locale = useLocale()
  console.log('Detected locale in Calendar:', locale)
  return (
    <div>
      <h2>{t('title')}</h2>
      <p>{t('description')}</p>
    </div>
  )
}
