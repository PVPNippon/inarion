'use client'
import clsx from 'clsx'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

export default function LocaleSwitcherSelect({ children, defaultValue, label }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname() // Get the current path

  function onSelectChange(event) {
    const nextLocale = event.target.value

    startTransition(() => {
      // Remove the existing locale from the pathname
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '')

      // Construct the new path with the selected locale
      router.replace(`/${nextLocale}${pathWithoutLocale}`)
    })
  }

  return (
    <label className={clsx('relative text-gray-400', isPending && 'transition-opacity [&:disabled]:opacity-30')}>
      <p className="sr-only">{label}</p>
      <select
        className="inline-flex appearance-none bg-transparent py-3 pl-2 pr-6"
        defaultValue={defaultValue}
        disabled={isPending}
        onChange={onSelectChange}
      >
        {children}
      </select>
    </label>
  )
}
