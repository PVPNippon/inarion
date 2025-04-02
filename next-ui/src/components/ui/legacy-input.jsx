import * as React from 'react'

import { cn } from '@/lib/utils'

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const Input = React.forwardRef(({ className, type, hasIcon, ...props }, ref) => {
  return (
    <div className="relative w-full">
      {hasIcon && (
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      )}
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-muted-foreground text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-bold file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-input focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50',
          hasIcon ? 'pl-10' : '', // Add padding when the icon is present
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
})
Input.displayName = 'Input'

export { Input }
