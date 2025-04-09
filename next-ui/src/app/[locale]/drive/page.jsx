/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import ListMyDriveFiles from '../../ui/components/ListMyDriveFiles'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MultipleSelect } from '@/components/ui/multiple-select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { mimeTypes, ownersList } from '../../ui/variables/variables'

export default function MyDriveFiles() {
  const [showDeletedItems, setShowDeletedItems] = useState(false)
  const [showSharedDrives, setShowSharedDrives] = useState(false)
  const [owner, setOwner] = useState('')
  const [sharedDrive, setSharedDrive] = useState('')
  const [sharedWith, setSharedWith] = useState('')
  const [sharedExternally, setSharedExternally] = useState('')
  const [linkSharing, setLinkSharing] = useState('')
  const [fileSize, setFileSize] = useState([])
  const [trashed, setTrashed] = useState('')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [hasMembers, setHasMembers] = useState('')
  const [hasManagers, setHasManagers] = useState('')
  const [unit, setUnit] = useState('mb')
  const [filteredOwners, setFilteredOwners] = useState(ownersList)
  const [open, setOpen] = useState(false)

  const handleTypeChange = (value) => {
    setSelectedTypes((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value) // Remove the value if it was already selected
      } else {
        return [...prev, value] // Add the value if it wasn't selected
      }
    })
  }

  // Create a mapping of selected short labels
  const selectedLabels = selectedTypes.map((type) => {
    const mime = mimeTypes.find((m) => m.value === type)
    return mime ? mime.label : type // Fallback to the value if no mapping is found
  })

  const clearFilters = () => {
    // Reset all select values to default
    setOwner('')
    setSharedDrive('')
    setSharedWith('')
    setSharedExternally('')
    setLinkSharing('')
    setHasMembers('')
    setHasManagers('')
    setFileSize([0, 0])
    setTrashed('')
    setSelectedTypes([])
  }

  const Owner = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="select" className="w-auto">
            {owner ? `Owner: ${owner}` : 'Owner'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Search for a user" />
            <CommandGroup heading="Suggestions">
              <CommandList>
                {filteredOwners.length > 0 ? (
                  filteredOwners.map((ownerName) => (
                    <CommandItem key={ownerName} onSelect={() => setOwner(ownerName)}>
                      {ownerName}
                    </CommandItem>
                  ))
                ) : (
                  <CommandItem disabled>No results found</CommandItem>
                )}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // Repeat similar changes for SharedDrive, SharedWith, and FileSize components

  const SharedDrive = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="select" className="w-auto">
            {sharedDrive ? `Location: In Shared drive ${sharedDrive}` : 'Shared Drive'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Search for a shared drive name or ID" />
            <CommandGroup heading="Suggestions">
              <CommandList>
                {filteredOwners.length > 0 ? (
                  filteredOwners.map((ownerName) => (
                    <CommandItem key={ownerName} onSelect={() => setSharedDrive(ownerName)}>
                      {ownerName}
                    </CommandItem>
                  ))
                ) : (
                  <CommandItem disabled>No results found</CommandItem>
                )}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
  const SharedWith = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="select" className="w-auto">
            {sharedWith ? `Shared with: ${sharedWith}` : 'Shared With'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Search for a user or a group" />
            <CommandGroup heading="Suggestions">
              <CommandList>
                {filteredOwners.length > 0 ? (
                  filteredOwners.map((ownerName) => (
                    <CommandItem key={ownerName} onSelect={() => setSharedWith(ownerName)}>
                      {ownerName}
                    </CommandItem>
                  ))
                ) : (
                  <CommandItem disabled>No results found</CommandItem>
                )}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  const LinkSharing = () => {
    return (
      <Select value={linkSharing} onValueChange={setLinkSharing}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Link Sharing" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const SharedExternally = () => {
    return (
      <Select value={sharedExternally} onValueChange={setSharedExternally}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Shared Externally?" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const FileSize = () => {
    // Define the schema with Zod
    const formSchema = z.object({
      minValue: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
        message: 'Min value must be a positive integer',
      }),
      maxValue: z.string().refine((val) => !isNaN(parseInt(val, 10)), {
        message: 'Max value must be a positive integer',
      }),
      unit: z.enum(['mb', 'gb', 'tb']),
    })

    // Initialize the form using react-hook-form and Zod resolver for validation
    const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: {
        unit: 'mb', // Default to MB
      },
    })

    // Display format for file size range
    const displayFileSize = `${fileSize[0]} - ${fileSize[1]} ${unit.toUpperCase()}`

    // Handle form submission
    const onSubmit = (values) => {
      setFileSize([values.minValue, values.maxValue])
      setUnit(values.unit)
      console.log(values) // You can handle the form values here
      // Use values.minValue, values.maxValue, and values.unit to update the file size range
      setOpen(false)
    }

    return (
      <Popover open={open} onOpenChange={(state) => setOpen(state)}>
        <PopoverTrigger asChild>
          <Button variant="select" className="w-auto" onClick={() => setOpen(true)}>
            {fileSize[0] || fileSize[1] ? `File Size: ${displayFileSize}` : 'File Size'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              {/* FormField for minValue */}
              <FormField
                control={form.control}
                name="minValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Value</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onWheel={(e) => e.target.blur()} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* FormField for maxValue */}
              <FormField
                control={form.control}
                name="maxValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Value</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onWheel={(e) => e.target.blur()} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Select component for unit (MB, GB, TB) */}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Unit</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value)} // Update form state with selected value
                      >
                        <SelectTrigger className="w-auto">
                          <SelectValue placeholder="Select Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="mb">MB</SelectItem>
                            <SelectItem value="gb">GB</SelectItem>
                            <SelectItem value="tb">TB</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </PopoverContent>
      </Popover>
    )
  }

  const Trashed = () => {
    return (
      <Select value={trashed} onValueChange={setTrashed}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Trashed?" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const Type = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="select" className="w-auto overflow-hidden whitespace-nowrap text-ellipsis">
            {selectedLabels.length > 0 ? `Type: ${selectedLabels.join(', ')}` : 'Type'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-h-48 overflow-auto">
          {/* Set max-height and overflow */}
          {mimeTypes.map((mime) => (
            <label
              key={mime.value}
              className="flex items-center space-x-2 hover:bg-primary-foreground rounded-sm cursor-pointer"
            >
              <MultipleSelect
                checked={selectedTypes.includes(mime.value)}
                onCheckedChange={() => handleTypeChange(mime.value)}
              />
              <span>{mime.label}</span>
            </label>
          ))}
        </PopoverContent>
      </Popover>
    )
  }

  const HasMembers = () => {
    return (
      <Select value={hasMembers} onValueChange={setHasMembers}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Has members?" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const HasManagers = () => {
    return (
      <Select value={hasManagers} onValueChange={setHasManagers}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Has managers?" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  return (
    <div>
      <div className="w-[1073px] overflow-auto">
        <div className="flex flex-col gap-[20px]">
          <span className="text-2xl font-medium leading-8">Drive Analyzer</span>
          <span className="text-lg text-muted-foreground">List of Files, Folders, or Drives</span>
        </div>

        {/* Input & Switches */}
        <div className="flex flex-wrap items-center mt-6 justify-between gap-6">
          <div className="w-full lg:w-1/3 grow">
            <Input type="text" hasIcon={true} placeholder="Input the name or ID of an item or drive" />
          </div>

          {/* Filter for deleted items switch */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Label htmlFor="deleted-items">Filter for deleted items</Label>
            <Switch
              id="deleted-items"
              checked={showDeletedItems}
              onCheckedChange={() => setShowDeletedItems(!showDeletedItems)}
            />
          </div>

          {/* List shared drives switch */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Label htmlFor="shared-drive">List Shared drives</Label>
            <Switch
              id="shared-drive"
              checked={showSharedDrives}
              onCheckedChange={() => setShowSharedDrives(!showSharedDrives)}
            />
          </div>
        </div>
      </div>
      <div>
        {/* Conditional rendering of Selects based on switches */}
        <div className="w-full relative flex items-center rounded-lg py-2 gap-2 mt-4">
          {/* If both switches are off */}
          {!showDeletedItems && !showSharedDrives && (
            <>
              <Owner />

              <SharedDrive />

              <SharedWith />

              <LinkSharing />

              <SharedExternally />

              <FileSize />
              <Trashed />
              <Type />
              <HasMembers />
              <HasManagers />
            </>
          )}

          {/* If only "List Shared Drives" is toggled */}
          {showSharedDrives && !showDeletedItems && (
            <>
              <SharedWith />

              <SharedExternally />
            </>
          )}

          {/* If only "Filter for Deleted Items" is toggled */}
          {showDeletedItems && !showSharedDrives && (
            <>
              <Owner />

              <SharedDrive />

              <Type />
            </>
          )}
        </div>
        <div className="w-full relative flex items-center rounded-lg py-2 gap-[10px] mt-4">
          {/* Go Button */}
          <Button size="sm">Go</Button>

          {/* Clear All Filters Button */}
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      <div className="w-full h-50 overflow-auto mt-10">
        <ListMyDriveFiles />
      </div>
    </div>
  )
}
