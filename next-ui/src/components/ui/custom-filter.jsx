/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDownIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupsStyles } from '@/app/ui/variables/group-variables'

function CustomFilterWrapper({ children }) {
  return <div className={groupsStyles.filterButtonOrChip}>{children}</div>
}

function CustomFilterClose({ handleClose, hiddenClass }) {
  return <X size={16} className={`opacity-50 cursor-pointer ${hiddenClass}`} onClick={handleClose} />
}

const CustomSelectTrigger = React.forwardRef(
  ({ className, hiddenClass, handleClose, children, onOpenChange, ...props }, ref) => {
    return (
      <CustomFilterWrapper>
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
        <CustomFilterClose handleClose={handleClose} hiddenClass={hiddenClass} />
      </CustomFilterWrapper>
    )
  }
)
CustomSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

export { CustomSelectTrigger, CustomFilterWrapper, CustomFilterClose }
