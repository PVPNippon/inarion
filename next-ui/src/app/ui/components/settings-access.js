/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckIcon } from '@radix-ui/react-icons'
import { AlertCircleIcon } from 'lucide-react'
import { AvatarFallback, Avatar, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup } from '@/components/ui/command'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const people = [
  { name: 'Julia User', email: 'user@domain.com', role: 'Owner', external: false },
  { name: 'Julia Gulia', email: 'julia@gmail.com', role: 'Editor', external: true },
  { name: 'Julia Ailuj', email: 'julia@domain.com', role: 'Editor', external: false },
]

const accessOptions = ['Owner', 'Editor', 'Viewer', 'Content Manager', 'Contributer', 'Commenter', 'Manager']

const generalAccessOptions = [
  { label: 'Anyone with the link', description: 'Anyone on the internet with the link can view' },
  { label: 'Restricted', description: 'Only people with access can open with the link' },
  { label: 'Anyone in the organization', description: 'Anyone in the organization can view' },
]

const itemCount = 450000
const percentage = 90
const storageUsed = 22.5
const storageUsedPercentage = 2
const trashCount = 10000

function UserItem({ avatar, name, email, views, edits }) {
  return (
    <div className="flex items-center justify-between py-4">
      {/* Left side: Avatar, name, and email */}
      <div className="flex items-center gap-4">
        <img src={avatar} alt={`${name}'s avatar`} className="w-10 h-10 rounded-full" />
        <div>
          <h2 className="font-semibold text-gray-900">{name}</h2>
          <span className="text-sm text-gray-500">{email}</span>
        </div>
      </div>

      {/* Right side: Views and Edits */}
      <div className="text-right">
        <span className="text-sm">{views} views</span>
        <span className="text-sm">{edits} edits</span>
      </div>
    </div>
  )
}

const SettingsAccess = () => {
  const [selectedOption, setSelectedOption] = React.useState(generalAccessOptions[0])
  const [searchQuery, setSearchQuery] = React.useState('')
  const CustomToggleGroup = () => {
    return (
      <ToggleGroup variant="link" type="single" size="sm">
        <ToggleGroupItem value="week">W</ToggleGroupItem>
        <ToggleGroupItem value="month">M</ToggleGroupItem>
        <ToggleGroupItem value="3month">3M</ToggleGroupItem>
        <ToggleGroupItem value="6month">6M</ToggleGroupItem>
      </ToggleGroup>
    )
  }
  return (
    <div>
      <div className="flex space-x-6">
        <div className="space-y-8 w-1/2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Usage</CardTitle>
                <CardDescription>Check usage details for this Shared drive</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <Card className="p-6 ">
                    <CardContent className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Number of items*</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-semibold">{itemCount.toLocaleString()}</span>
                          <span className="text-lg text-muted-foreground">({percentage}%)</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircleIcon className="text-destructive" size={16} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <span>
                                  A shared drive can contain a maximum of 500,000 items, including files, folders,
                                  shortcuts, and items in the trash.
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View hierarchy
                      </Button>
                    </CardContent>
                    <CardContent className="mt-4">
                      <Progress value={percentage} className="h-4" />
                    </CardContent>
                  </Card>
                  <Card className="p-6 ">
                    <CardContent className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Storage Used</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-semibold">{storageUsed.toLocaleString()} GB</span>
                          <span className="text-lg text-muted-foreground">({storageUsedPercentage}%)</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardContent className="mt-4">
                      <Progress value={storageUsedPercentage} className="h-4" />
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              <CardContent className="space-y-1">
                <span className="text-sm">
                  <span className="font-semibold">*{trashCount.toLocaleString()} items</span> are in this Shared drive’s
                  trash
                </span>
                <span className="text-xs text-muted-foreground">
                  Items in trash are also included in the item count.
                </span>
              </CardContent>
            </Card>
          </div>
          <div className="w-full space-y-6">
            {/* Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Review key settings applied to this file and to the owner’s organizational unit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <span className="font-medium">Domain settings</span>
                  <div className="space-y-8">
                    <div className="flex items-center space-x-4">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <h5>
                        Sharing settings applied to the owner’s organizational unit allow them to share externally
                      </h5>
                    </div>
                    <div className="flex items-center space-x-4">
                      <AlertCircleIcon className="h-4 w-4 text-destructive" />
                      <h5>Creating new Drive files is turned OFF for the owner’s organizational unit</h5>
                    </div>
                  </div>
                  <span className="font-medium">File Settings</span>
                  <div className="space-y-8">
                    <div className="flex items-center space-x-4">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <h5>Editors can change permissions and share</h5>
                    </div>
                    <div className="flex items-center space-x-4">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <h5>Viewers and commenters can see the option to download, print, and copy</h5>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Item Access</CardTitle>
              <CardDescription>
                <>
                  <AlertCircleIcon className="h-4 w-4 text-destructive inline-block" />
                  <span className="font-semibold ml-4">
                    Creating new Drive files is turned OFF for the owner’s organizational unit
                  </span>
                </>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* space-y-8 applies 32px vertical gap */}
                <Command>
                  <CommandInput placeholder="Search people..." />
                  <CommandList>
                    <CommandGroup heading="People with access">
                      {people
                        .filter(
                          (person) =>
                            person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            person.email.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((person, index) => (
                          <CommandItem key={index} className="px-4 py-2">
                            <div className="flex items-center justify-between w-full gap-4">
                              {/* Left Section: Avatar, Name, Email */}
                              <div className="flex items-center gap-4">
                                <Avatar>
                                  <AvatarImage src={`https://github.com/shadcn.png`} alt={person.name} />
                                  <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-base font-medium">{person.name}</span>
                                  <span className="text-base text-muted-foreground">{person.email}</span>
                                </div>
                              </div>

                              {/* Right Section: Alert Icon and Select */}
                              <div className="flex items-center gap-2">
                                {person.external && <AlertCircleIcon className="text-destructive" size={18} />}
                                <Select defaultValue={person.role}>
                                  <SelectTrigger className="w-28 flex justify-between items-center">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accessOptions.map((role) => (
                                      <SelectItem key={role} value={role}>
                                        {role}
                                      </SelectItem>
                                    ))}
                                    {/* Separator and Remove Access Option */}
                                    <Separator></Separator>
                                    <SelectItem key="remove-access" value="remove-access">
                                      Remove access
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandEmpty>No results found.</CommandEmpty>
                  </CommandList>
                </Command>
              </div>
            </CardContent>
          </Card>
          <div className="w-full mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Active Users</CardTitle>
                <CardDescription className="place-items-start">
                  <CustomToggleGroup />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <UserItem
                    avatar="https://github.com/shadcn.png" // Replace with the actual avatar URL
                    name="Julia User"
                    email="user@domain.com"
                    views="14"
                    edits="6"
                  />
                  <UserItem
                    avatar="https://github.com/shadcn.png" // Replace with the actual avatar URL
                    name="Julia Ailuj"
                    email="julia@domain.com"
                    views="12"
                    edits="0"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Downloads/Size/Views Cards */}
          <div className="grid grid-cols-3 mt-6 gap-6">
            <Card className="max-w-[185px] max-h-[180px]">
              <CardHeader>
                <CardTitle>Downloads</CardTitle>
                <CardDescription>
                  <CustomToggleGroup />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h1 className="font-semibold text-[40px]">32</h1>
              </CardContent>
            </Card>

            <Card className="max-w-[185px] max-h-[180px]">
              <CardHeader>
                <CardTitle>Size</CardTitle>
              </CardHeader>
              <CardContent>
                <h1 className="font-semibold text-[40px]">1.2 MB</h1>
              </CardContent>
            </Card>

            <Card className="max-w-[185px] max-h-[180px]">
              <CardHeader>
                <CardTitle>Views</CardTitle>
                <CardDescription>
                  <CustomToggleGroup />
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h1 className="font-semibold text-[40px]">80</h1>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export { SettingsAccess }
