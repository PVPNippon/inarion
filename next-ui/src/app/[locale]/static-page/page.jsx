'use client'

import * as React from 'react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  BeakerIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ChevronUpDownIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calculator, CreditCard, Settings, Smile, User } from 'lucide-react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CalendarIcon, EnvelopeClosedIcon, FaceIcon, GearIcon, PersonIcon, RocketIcon } from '@radix-ui/react-icons'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ToastAction } from '@/components/ui/toast'
// import { toast } from 'sonner'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { CalendarDays } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CustomTable,
  CustomTableBody,
  CustomTableCaption,
  CustomTableCell,
  CustomTableFooter,
  CustomTableHead,
  CustomTableHeader,
  CustomTableRow,
} from '@/components/ui/custom-table'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'

const invoices = [
  {
    invoice: 'INV001',
    paymentStatus: 'Paid',
    totalAmount: '$250.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV002',
    paymentStatus: 'Pending',
    totalAmount: '$150.00',
    paymentMethod: 'PayPal',
  },
  {
    invoice: 'INV003',
    paymentStatus: 'Unpaid',
    totalAmount: '$350.00',
    paymentMethod: 'Bank Transfer',
  },
  {
    invoice: 'INV004',
    paymentStatus: 'Paid',
    totalAmount: '$450.00',
    paymentMethod: 'Credit Card',
  },
  {
    invoice: 'INV005',
    paymentStatus: 'Paid',
    totalAmount: '$550.00',
    paymentMethod: 'PayPal',
  },
  {
    invoice: 'INV006',
    paymentStatus: 'Pending',
    totalAmount: '$200.00',
    paymentMethod: 'Bank Transfer',
  },
  {
    invoice: 'INV007',
    paymentStatus: 'Unpaid',
    totalAmount: '$300.00',
    paymentMethod: 'Credit Card',
  },
]

const components = [
  {
    title: 'Alert Dialog',
    href: '/docs/primitives/alert-dialog',
    description: 'A modal dialog that interrupts the user with important content and expects a response.',
  },
  {
    title: 'Hover Card',
    href: '/docs/primitives/hover-card',
    description: 'For sighted users to preview content available behind a link.',
  },
  {
    title: 'Progress',
    href: '/docs/primitives/progress',
    description:
      'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
  },
  {
    title: 'Scroll-area',
    href: '/docs/primitives/scroll-area',
    description: 'Visually or semantically separates content.',
  },
  {
    title: 'Tabs',
    href: '/docs/primitives/tabs',
    description: 'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
  },
  {
    title: 'Tooltip',
    href: '/docs/primitives/tooltip',
    description:
      'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
  },
]

export default function StaticPage() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [progress, setProgress] = React.useState(13)
  const [date, setDate] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])
  const { toast } = useToast()

  return (
    <div className="min-h-screen bg-white flex p-10">
      <div className="overflow-auto flex-grow max-w-full max-h-full p-3">
        <div>
          <h1 className="text-xl font-semibold mb-2">Button components</h1>
          {/* Row 1: Filled Buttons */}
          <ButtonWrapper title="Default Button (variant unspecified):">
            <Button>Button</Button>
            <Button disabled>Button</Button>
            <Button size="sm">Button</Button>
            <Button disabled size="sm">
              Button
            </Button>
            <Button size="lg">Button</Button>
            <Button disabled size="lg">
              Button
            </Button>
            <Button size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
            <Button disabled size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
          </ButtonWrapper>

          {/* Row 2: Outlined Buttons */}
          <ButtonWrapper title="Outlined Button (variant='outline'):">
            <Button variant="outline">Button</Button>
            <Button disabled variant="outline">
              Button
            </Button>
            <Button variant="outline" size="sm">
              Button
            </Button>
            <Button disabled variant="outline" size="sm">
              Button
            </Button>
            <Button variant="outline" size="lg">
              Button
            </Button>
            <Button disabled variant="outline" size="lg">
              Button
            </Button>
            <Button variant="outline" size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
            <Button disabled variant="outline" size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
          </ButtonWrapper>

          {/* Row 3: Black Text Buttons */}
          <ButtonWrapper title="Black Text Button (variant='ghost'):">
            <Button variant="ghost">Button</Button>
            <Button disabled variant="ghost">
              Button
            </Button>
            <Button variant="ghost" size="sm">
              Button
            </Button>
            <Button disabled variant="ghost" size="sm">
              Button
            </Button>
            <Button variant="ghost" size="lg">
              Button
            </Button>
            <Button disabled variant="ghost" size="lg">
              Button
            </Button>
            <Button variant="ghost" size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
            <Button disabled variant="ghost" size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
          </ButtonWrapper>

          {/* Row 4: Default Text Buttons */}
          <ButtonWrapper title="Default Text Button (variant='link'):">
            <Button variant="link">Button</Button>
            <Button disabled variant="link">
              Button
            </Button>
            <Button variant="link" size="sm">
              Button
            </Button>
            <Button disabled variant="link" size="sm">
              Button
            </Button>
            <Button variant="link" size="lg">
              Button
            </Button>
            <Button disabled variant="link" size="lg">
              Button
            </Button>
            <Button variant="link" size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
            <Button disabled variant="link" size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
          </ButtonWrapper>

          {/* Row 5: Destructive Buttons */}
          <ButtonWrapper title="Destructive Button (variant='destructive'):">
            <Button variant="destructive">Button</Button>
            <Button variant="destructive" disabled>
              Button
            </Button>
            <Button variant="destructive" size="sm">
              Button
            </Button>
            <Button variant="destructive" disabled size="sm">
              Button
            </Button>
            <Button variant="destructive" size="lg">
              Button
            </Button>
            <Button variant="destructive" disabled size="lg">
              Button
            </Button>
            <Button variant="destructive" size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
            <Button variant="destructive" disabled size="icon">
              <BeakerIcon className="h-5 w-5" />
            </Button>
          </ButtonWrapper>
        </div>

        {/* Accordion */}
        <div className="w-full">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that matches the other components&apos; aesthetic.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is it animated?</AccordionTrigger>
              <AccordionContent>Yes. It's animated by default, but you can disable it if you prefer.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        {/* Carousel */}
        <div className="flex items-center justify-center w-full">
          <Carousel className="w-full max-w-xs">
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex aspect-square items-center justify-center p-6">
                        <span className="text-4xl font-semibold">{index + 1}</span>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <br />
        {/* Toggle */}
        <div>
          <Toggle aria-label="Toggle italic">
            <BoldIcon className="h-4 w-4" />
          </Toggle>
        </div>
        {/* ToggleGroup */}
        <div>
          <ToggleGroup type="multiple">
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
              <BoldIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
              <ItalicIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
              <UnderlineIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <br />
        {/* Collapsible */}
        <div>
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px] space-y-2">
            <div className="flex items-center justify-between space-x-4 px-4">
              <h4 className="text-sm font-semibold">@peduarte starred 3 repositories</h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronUpDownIcon className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <div className="rounded-md border border-foreground/20 px-4 py-2 font-mono text-sm shadow-sm">
              @radix-ui/primitives
            </div>
            <CollapsibleContent className="space-y-2">
              <div className="rounded-md border border-foreground/20 px-4 py-2 font-mono text-sm shadow-sm">
                @radix-ui/colors
              </div>
              <div className="rounded-md border border-foreground/20 px-4 py-2 font-mono text-sm shadow-sm">
                @stitches/react
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <br />
        {/* Menubar */}
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New Tab <MenubarShortcut>⌘T</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                New Window <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled>New Incognito Window</MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Share</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Email link</MenubarItem>
                  <MenubarItem>Messages</MenubarItem>
                  <MenubarItem>Notes</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem>
                Print... <MenubarShortcut>⌘P</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Undo <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Find</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>Search the web</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Find...</MenubarItem>
                  <MenubarItem>Find Next</MenubarItem>
                  <MenubarItem>Find Previous</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem>Cut</MenubarItem>
              <MenubarItem>Copy</MenubarItem>
              <MenubarItem>Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem>Always Show Bookmarks Bar</MenubarCheckboxItem>
              <MenubarCheckboxItem checked>Always Show Full URLs</MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarItem inset>
                Reload <MenubarShortcut>⌘R</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled inset>
                Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem inset>Toggle Fullscreen</MenubarItem>
              <MenubarSeparator />
              <MenubarItem inset>Hide Sidebar</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Profiles</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="benoit">
                <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                <MenubarRadioItem value="Luis">Luis</MenubarRadioItem>
              </MenubarRadioGroup>
              <MenubarSeparator />
              <MenubarItem inset>Edit...</MenubarItem>
              <MenubarSeparator />
              <MenubarItem inset>Add Profile...</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <br />
        <br />
        {/* Breadcrumb */}
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="">Components</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <br />
        {/* Tabs */}
        <div>
          <Tabs defaultValue="account" className="w-[500px]">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="paymentInfo">Payment Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <br />
        {/* Pagination */}
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        <br />
        {/* NavigationMenu */}
        <div>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <>
                          <a
                            href="http://localhost:3000/"
                            className="flex h-full w-full select-none flex-col justify-end rounded-md
                            bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          >
                            <div className="mb-2 mt-4 text-lg font-medium">shadcn/ui</div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Beautifully designed components built with Radix UI and Tailwind CSS.
                            </p>
                          </a>
                        </>
                      </NavigationMenuLink>
                    </li>
                    <ListItem href="/docs" title="Introduction">
                      Re-usable components built using Radix UI and Tailwind CSS.
                    </ListItem>
                    <ListItem href="/docs/installation" title="Installation">
                      How to install dependencies and structure your app.
                    </ListItem>
                    <ListItem href="/docs/primitives/typography" title="Typography">
                      Styles for headings, paragraphs, lists...etc
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    {components.map((component) => (
                      <ListItem key={component.title} title={component.title} href={component.href}>
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Documentation</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <br />

        <div className="grid w-full max-w-sm items-center gap-1.5">
          {/* Input */}
          <Input type="email" placeholder="Email" />
          {/* Choose File */}
          <Input id="picture" type="file" />
          {/* Input diabled */}
          <Input disabled type="email" placeholder="Email" />
          {/* Select */}
          <Select>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>North America</SelectLabel>
                <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
                <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
                <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
                <SelectItem value="akst">Alaska Standard Time (AKST)</SelectItem>
                <SelectItem value="hst">Hawaii Standard Time (HST)</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Europe & Africa</SelectLabel>
                <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                <SelectItem value="cet">Central European Time (CET)</SelectItem>
                <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
                <SelectItem value="west">Western European Summer Time (WEST)</SelectItem>
                <SelectItem value="cat">Central Africa Time (CAT)</SelectItem>
                <SelectItem value="eat">East Africa Time (EAT)</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Asia</SelectLabel>
                <SelectItem value="msk">Moscow Time (MSK)</SelectItem>
                <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                <SelectItem value="cst_china">China Standard Time (CST)</SelectItem>
                <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
                <SelectItem value="kst">Korea Standard Time (KST)</SelectItem>
                <SelectItem value="ist_indonesia">Indonesia Central Standard Time (WITA)</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Australia & Pacific</SelectLabel>
                <SelectItem value="awst">Australian Western Standard Time (AWST)</SelectItem>
                <SelectItem value="acst">Australian Central Standard Time (ACST)</SelectItem>
                <SelectItem value="aest">Australian Eastern Standard Time (AEST)</SelectItem>
                <SelectItem value="nzst">New Zealand Standard Time (NZST)</SelectItem>
                <SelectItem value="fjt">Fiji Time (FJT)</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>South America</SelectLabel>
                <SelectItem value="art">Argentina Time (ART)</SelectItem>
                <SelectItem value="bot">Bolivia Time (BOT)</SelectItem>
                <SelectItem value="brt">Brasilia Time (BRT)</SelectItem>
                <SelectItem value="clt">Chile Standard Time (CLT)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <br />
          {/* Radio Group */}
          <RadioGroup defaultValue="comfortable">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="default" id="r1" />
              <Label htmlFor="r1">Default</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="comfortable" id="r2" />
              <Label htmlFor="r2">Comfortable</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="r3" />
              <Label htmlFor="r3">Compact</Label>
            </div>
          </RadioGroup>
        </div>
        <br />
        {/* Switch */}
        <div className="flex items-center space-x-2">
          <Switch id="airplane-mode" />
          <Label htmlFor="airplane-mode">Airplane Mode</Label>
        </div>
        <br />
        {/*Text Area*/}
        <div>
          <Textarea placeholder="Type your message here." />
        </div>
        <br />
        {/*Input OTP*/}
        <div>
          <InputOTP maxLength={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <br />
        {/*Checkbox*/}
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Accept terms and conditions
          </label>
        </div>
        <br />
        {/*Slider*/}
        <div className="w-[300px]">
          <Slider defaultValue={[33]} max={100} step={1} />
        </div>
        <br />
        {/*Alerts*/}
        <div>
          <Alert>
            <RocketLaunchIcon className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>You can add components to your app using the cli.</AlertDescription>
          </Alert>
        </div>
        <br />
        <div>
          <Alert variant="destructive">
            <RocketLaunchIcon className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>You can add components to your app using the cli.</AlertDescription>
          </Alert>
        </div>
        <br />
        {/*Card*/}
        <div>
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Lorem Ipsum</CardTitle>
              <CardDescription>Lorem Ipsum</CardDescription>
            </CardHeader>
            <CardContent>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
              ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur.
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </div>
        <br />
        {/*Avatar*/}
        <div>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
        <br />
        {/*Badge*/}
        <Badge>Badge</Badge>
        <br />
        <Badge variant="outline">Badge</Badge>
        <br />
        <Badge variant="secondary">Secondary</Badge>
        <br />
        <Badge variant="destructive">Destructive</Badge>
        <br />

        <br />
        {/* Seperator*/}
        <Separator className="my-4" />
        <br />
        {/*Progress*/}
        <div>
          <Progress value={progress} className="w-[30%]" />
        </div>
        <br />
        {/* Skeleton*/}
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <br />
        {/* Table */}
        <Table>
          <TableCaption>A list of your recent invoices.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.invoice}>
                <TableCell className="font-medium">{invoice.invoice}</TableCell>
                <TableCell>{invoice.paymentStatus}</TableCell>
                <TableCell>{invoice.paymentMethod}</TableCell>
                <TableCell className="text-right">{invoice.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">$2,500.00</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <br />
        {/* Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Edit Profile</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input id="username" defaultValue="@peduarte" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <br />
        <br />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Show Dialog</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove your data from our
                servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <br />
        <br />
        {/* Toast */}
        <Button
          variant="outline"
          onClick={() => {
            toast({
              title: 'Scheduled: Catch up ',
              description: 'Friday, February 10, 2023 at 5:57 PM',
              action: <ToastAction altText="Goto schedule to undo">Undo</ToastAction>,
            })
          }}
        >
          Add to calendar
        </Button>
        <br />
        <br />

        {/* Hover Card */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@nextjs</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <Avatar>
                <AvatarImage src="https://github.com/vercel.png" />
                <AvatarFallback>VC</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">@nextjs</h4>
                <p className="text-sm">The React Framework – created and maintained by @vercel.</p>
                <div className="flex items-center pt-2">
                  <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{' '}
                  <span className="text-xs text-muted-foreground">Joined December 2021</span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        <br />
        <br />
        {/* Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Dimensions</h4>
                <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="width">Width</Label>
                  <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxWidth">Max. width</Label>
                  <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="height">Height</Label>
                  <Input id="height" defaultValue="25px" className="col-span-2 h-8" />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="maxHeight">Max. height</Label>
                  <Input id="maxHeight" defaultValue="none" className="col-span-2 h-8" />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <br />
        <br />
        {/* Command */}
        <div>
          <Command className="rounded-lg border border-foreground/10 shadow-md md:min-w-[450px]">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>
                  <CalendarIcon />
                  <span>Calendar</span>
                </CommandItem>
                <CommandItem>
                  <Smile />
                  <span>Search Emoji</span>
                </CommandItem>
                <CommandItem disabled>
                  <Calculator />
                  <span>Calculator</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem>
                  <User />
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <CreditCard />
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
        <br />
        <br />
        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Billing
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Keyboard shortcuts
                <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Email</DropdownMenuItem>
                    <DropdownMenuItem>Message</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>More...</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuItem>
                New Team
                <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>GitHub</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuItem disabled>API</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <br />
        <br />
        {/* Context Menu */}
        <ContextMenu>
          <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
            Right click here
          </ContextMenuTrigger>
          <ContextMenuContent className="w-64">
            <ContextMenuItem inset>
              Back
              <ContextMenuShortcut>⌘[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem inset disabled>
              Forward
              <ContextMenuShortcut>⌘]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem inset>
              Reload
              <ContextMenuShortcut>⌘R</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem>
                  Save Page As...
                  <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>Create Shortcut...</ContextMenuItem>
                <ContextMenuItem>Name Window...</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>Developer Tools</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked>
              Show Bookmarks Bar
              <ContextMenuShortcut>⌘⇧B</ContextMenuShortcut>
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuRadioGroup value="pedro">
              <ContextMenuLabel inset>People</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
              <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
        <br />
        {/* Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add to library</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* Calendar */}
        {/* Commented out temporarily because the react-day-picker library is causing a conflict and the project cannot be run on Docker. */}
        {/* <Calendar mode="single" selected={date} onSelect={setDate} className="max-w-xs " /> */}
        {/* <CustomTable /> */}

        {/* <ScrollArea className="relative w-full px-5 py-3 overflow-auto border rounded-lg border-[#E4E4E7] h-[200px]"> */}
        <br />
        <br />
        <CustomTable>
          <CustomTableHeader>
            <CustomTableRow>
              <CustomTableHead className="w-[100px]">Invoice</CustomTableHead>
              <CustomTableHead>Status</CustomTableHead>
              <CustomTableHead>Method</CustomTableHead>
              <CustomTableHead className="text-right">Amount</CustomTableHead>
            </CustomTableRow>
          </CustomTableHeader>
          <CustomTableBody>
            <CustomTableRow>
              <CustomTableCell className="font-medium">INV001</CustomTableCell>
              <CustomTableCell>Paid</CustomTableCell>
              <CustomTableCell>Credit Card</CustomTableCell>
              <CustomTableCell className="text-right">$250.00</CustomTableCell>
            </CustomTableRow>
            <CustomTableRow>
              <CustomTableCell className="font-medium">INV001</CustomTableCell>
              <CustomTableCell>Paid</CustomTableCell>
              <CustomTableCell>Credit Card</CustomTableCell>
              <CustomTableCell className="text-right">$250.00</CustomTableCell>
            </CustomTableRow>
            <CustomTableRow>
              <CustomTableCell className="font-medium">INV001</CustomTableCell>
              <CustomTableCell>Paid</CustomTableCell>
              <CustomTableCell>Credit Card</CustomTableCell>
              <CustomTableCell className="text-right">$250.00</CustomTableCell>
            </CustomTableRow>
            <CustomTableRow>
              <CustomTableCell className="font-medium">INV001</CustomTableCell>
              <CustomTableCell>Paid</CustomTableCell>
              <CustomTableCell>Credit Card</CustomTableCell>
              <CustomTableCell className="text-right">$250.00</CustomTableCell>
            </CustomTableRow>
            <CustomTableRow>
              <CustomTableCell className="font-medium">INV001</CustomTableCell>
              <CustomTableCell>Paid</CustomTableCell>
              <CustomTableCell>Credit Card</CustomTableCell>
              <CustomTableCell className="text-right">$250.00</CustomTableCell>
            </CustomTableRow>
            <CustomTableRow>
              <CustomTableCell className="font-medium">INV001</CustomTableCell>
              <CustomTableCell>Paid</CustomTableCell>
              <CustomTableCell>Credit Card</CustomTableCell>
              <CustomTableCell className="text-right">$250.00</CustomTableCell>
            </CustomTableRow>
            <CustomTableRow>
              <CustomTableCell className="font-medium">INV001</CustomTableCell>
              <CustomTableCell>Paid</CustomTableCell>
              <CustomTableCell>Credit Card</CustomTableCell>
              <CustomTableCell className="text-right">$250.00</CustomTableCell>
            </CustomTableRow>
            <CustomTableRow>
              <CustomTableCell className="font-medium">INV001</CustomTableCell>
              <CustomTableCell>Paid</CustomTableCell>
              <CustomTableCell>Credit Card</CustomTableCell>
              <CustomTableCell className="text-right">$250.00</CustomTableCell>
            </CustomTableRow>
          </CustomTableBody>
        </CustomTable>
        <br />
        <div className=" flex flex-col items-center justify-center space-y-2">
          <div className="spinner-wrapper">
            <svg className="spinner" viewBox="0 0 50 50">
              <circle className="path" cx="25" cy="25" r="20" fill="none" stroke="#ef5039" strokeWidth="4" />
            </svg>
          </div>

          <p className="text-gray-600 text-sm font-medium">Upload in progress</p>
        </div>
      </div>
    </div>
  )
}

const ListItem = React.forwardRef(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = 'ListItem'

function ButtonWrapper({ children, title }) {
  return (
    <div className="flex flex-col gap-y-3 mb-5">
      <p className="text-md font-semibold">{title}</p>
      <div className="grid grid-cols-8 gap-4">{children}</div>
    </div>
  )
}
