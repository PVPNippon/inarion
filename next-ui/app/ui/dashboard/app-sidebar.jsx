import {
  HomeIcon,
  CalendarIcon,
  FolderIcon,
  BellIcon,
  Cog8ToothIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'

import { UsersIcon, FolderInputIcon, PyramidIcon } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { CollapsibleContent } from '@radix-ui/react-collapsible'

// Menu items.
const items = [
  {
    title: 'Home',
    url: '/',
    icon: HomeIcon,
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: CalendarIcon,
  },
  {
    title: 'Alert Center',
    url: '/notifications',
    icon: BellIcon,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Cog8ToothIcon,
  },
  {
    title: 'Logout',
    url: '/logout',
    icon: ArrowRightStartOnRectangleIcon,
  },
  {
    title: 'Static',
    url: '/static-page',
    icon: Cog8ToothIcon,
  },
]
const driveItems = [
  {
    title: 'My Drive',
    url: '/drive',
    icon: FolderIcon,
  },
]

const groupsItems = [
  {
    title: 'Groups',
    url: '/groups',
    icon: UsersIcon,
  },
  {
    title: 'Hierarchy',
    url: '/groups/hierarchy',
    icon: PyramidIcon,
  },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Drive & Docs
                <ChevronDownIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {driveItems.map((driveItem) => (
                    <SidebarMenuItem key={driveItem.title}>
                      <SidebarMenuButton asChild>
                        <a href={driveItem.url}>
                          <driveItem.icon />
                          <span>{driveItem.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Groups & Hierarchy
                <ChevronDownIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupsItems.map((groupItem) => (
                    <SidebarMenuItem key={groupItem.title}>
                      <SidebarMenuButton asChild>
                        <a href={groupItem.url}>
                          <groupItem.icon />
                          <span>{groupItem.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Application
                <ChevronDownIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  )
}
