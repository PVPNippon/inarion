import React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDownIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupsStyles } from '@/app/ui/variables/group-variables'

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
      <SelectPrimitive.Trigger ref={ref} className={cn(groupsStyles.filterButtonOrChip, className)} {...props}>
        {children}
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
        <X
          size={16}
          className={`opacity-50 ${hiddenClass}`}
          onClick={handleCloseClick}
          style={{ pointerEvents: isDisabled ? 'auto' : 'none' }}
        />
      </SelectPrimitive.Trigger>
    )
  }
)
CustomSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

export { CustomSelectTrigger }
