import * as React from 'react'

import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from './scroll-area'

const CustomTable = React.forwardRef(({ className, ...props }, ref) => (
  <ScrollArea
    type="scroll" //if you need the scroll bar to be displayed all the time, change the type to "always"
    className="relative w-full overflow-auto border rounded-lg border-[#E4E4E7] h-[200px]"
    disableScrollbar
  >
    <table ref={ref} className={cn(' w-full caption-bottom text-sm', className)} {...props} />
  </ScrollArea>
))
CustomTable.displayName = 'Table'

const CustomTableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn('sticky top-0 shadow-[0_1px_0_0_#E4E4E7]  bg-white [&_tr]:hover:bg-transparent', className)}
    {...props}
  />
))
CustomTableHeader.displayName = 'TableHeader'

const CustomTableBody = React.forwardRef(({ className, children, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0 ', className)} {...props}>
    {children}
    <tr>
      <td>
        <ScrollBar className="pt-[calc(3rem+2px)]" />
      </td>
    </tr>
  </tbody>
))
CustomTableBody.displayName = 'TableBody'

const CustomTableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t border-foreground/30 bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
    {...props}
  />
))
CustomTableFooter.displayName = 'TableFooter'

const CustomTableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'border-none transition-colors hover:bg-accent data-[state=selected]:bg-muted [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg',
      className
    )}
    {...props}
  />
))
CustomTableRow.displayName = 'TableRow'

const CustomTableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
))
CustomTableHead.displayName = 'TableHead'

const CustomTableCell = React.forwardRef(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]', className)}
    {...props}
  />
))
CustomTableCell.displayName = 'TableCell'

const CustomTableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
))
CustomTableCaption.displayName = 'TableCaption'

export {
  CustomTable,
  CustomTableHeader,
  CustomTableBody,
  CustomTableFooter,
  CustomTableHead,
  CustomTableRow,
  CustomTableCell,
  CustomTableCaption,
}
