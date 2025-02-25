import * as React from 'react'

const TABLET_BREAKPOINT = 1024

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < TABLET_BREAKPOINT)
      console.log(`Window Width Tablet`) // ✅ Log output
    }
    mql.addEventListener('change', onChange)
    setIsTablet(window.innerWidth >= 768 && window.innerWidth < TABLET_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isTablet
}
