import React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDownIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const CustomSelectTrigger = React.forwardRef(
  ({ className, hiddenClass, handleClose, children, onOpenChange, ...props }, ref) => {
    const isDisabled = hiddenClass === ''

    const handleCloseClick = (e) => {
      // Stop propagation to prevent opening the select
      e.stopPropagation()
      e.preventDefault()

      // Close the select
      onOpenChange?.(false)

      // Call the provided handleClose function
      handleClose()
    }

    return (
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          'flex h-9 w-full gap-2 items-center justify-between whitespace-nowrap rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm shadow-menu1 shadow-menu2 ring-offset-background placeholder:text-muted-foreground focus:outline-none  disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 relative',
          className
        )}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
        <span
          className={`opacity-50 ${hiddenClass}`}
          onClick={handleCloseClick}
          style={{ pointerEvents: isDisabled ? 'auto' : 'none' }}
        >
          <X size={16} className={hiddenClass} />
        </span>
      </SelectPrimitive.Trigger>
    )
  }
)
CustomSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

export { CustomSelectTrigger }
