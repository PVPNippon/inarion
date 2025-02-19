import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ request, requestLocale }) => {
  let locale = requestLocale || routing.defaultLocale

  // Check browser's preferred language
  if (!locale) {
    const acceptLanguage = request.headers.get('accept-language')
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage.split(',')[0].split('-')[0] // Extract first language
      if (routing.locales.includes(preferredLocale)) {
        locale = preferredLocale
      }
    }
  }

  // If locale is still not in the allowed list, fallback to default
  if (!routing.locales.includes(locale)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
