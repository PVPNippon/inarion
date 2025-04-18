/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'

const CustomListAccordion = AccordionPrimitive.Root

const CustomListAccordionItem = React.forwardRef(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn('', className)} {...props} />
))
CustomListAccordionItem.displayName = 'AccordionItem'

const CustomListAccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn('text-left text-sm transition-all [&[data-state=open]>svg]:rotate-180', className)}
      {...props}
    >
      {children}
      {/* <ChevronDownIcon className="h-4 w-4 shrink-0 text-black transition-transform duration-200" /> */}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
CustomListAccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const CustomListAccordionContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-0 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
))
CustomListAccordionContent.displayName = AccordionPrimitive.Content.displayName

export { CustomListAccordion, CustomListAccordionItem, CustomListAccordionTrigger, CustomListAccordionContent }
