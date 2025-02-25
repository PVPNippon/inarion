'use client' // Ensure CSR
import {
  HomeIcon,
  CalendarIcon,
  FolderIcon,
  BellIcon,
  Cog8ToothIcon,
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

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

export function AppSidebar() {
  const t = useTranslations('sidebar')

  // Menu items with translations
  const items = [
    { title: t('menu.home'), url: '/', icon: HomeIcon },
    { title: t('menu.calendar'), url: '/calendar', icon: CalendarIcon },
    { title: t('menu.alertCenter'), url: '/notifications', icon: BellIcon },
    { title: t('menu.settings'), url: '/settings', icon: Cog8ToothIcon },
    { title: t('menu.logout'), url: '/logout', icon: ArrowRightStartOnRectangleIcon },
    { title: t('menu.static'), url: '/static-page', icon: Cog8ToothIcon },
  ]

  const driveItems = [{ title: t('menu.myDrive'), url: '/drive', icon: FolderIcon }]

  const groupsItems = [
    { title: t('menu.groups'), url: '/groups', icon: UsersIcon },
    { title: t('menu.hierarchy'), url: '/groups/hierarchy', icon: PyramidIcon },
  ]
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader></SidebarHeader>
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
                      <SidebarMenuButton tooltip={driveItem.title} asChild>
                        <Link href={driveItem.url}>
                          <driveItem.icon />
                          <span>{driveItem.title}</span>
                        </Link>
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
                      <SidebarMenuButton tooltip={groupItem.title} asChild>
                        <Link href={groupItem.url}>
                          <groupItem.icon />
                          <span>{groupItem.title}</span>
                        </Link>
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
                      <SidebarMenuButton tooltip={item.title} asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
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
