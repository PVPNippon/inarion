import React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDownIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupsStyles } from '@/app/ui/variables/group-variables'

const CustomSelectTrigger = React.forwardRef(
  ({ className, hiddenClass, handleClose, children, onOpenChange, ...props }, ref) => {
    return (
      <div className={groupsStyles.filterButtonOrChip}>
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn('flex flex-row gap-x-2 items-center cursor-pointer focus:outline-none', className)}
          {...props}
        >
          {children}
          <SelectPrimitive.Icon asChild>
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <X size={16} className={`opacity-50 ${hiddenClass} cursor-pointer`} onClick={handleClose} />
      </div>
    )
  }
)
CustomSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

export { CustomSelectTrigger }
