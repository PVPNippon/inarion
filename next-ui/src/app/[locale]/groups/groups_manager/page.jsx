'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiClient } from '@/utils/apiClient'
import { ExternalLinkIcon, SearchIcon, EyeIcon, Ellipsis, CircleAlert } from 'lucide-react'
import { groupsStyles } from '@/app/ui/variables/group-variables'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import CsvDownloadButton from 'react-json-to-csv'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogPortal,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CustomIconExport } from '@/app/ui/svg-icons/custom-icons'

function GroupsManager() {
  const [groupList, setGroupList] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emptyResult, setEmptyResult] = useState(false)
  const [query, setQuery] = useState('')
  const [hiddenClass, setHiddenClass] = useState('')

  const email = 'testadmin@pvp-test-domain2.com'

  useEffect(() => {
    const controller = new AbortController()

    async function fetchGroupsTable() {
      if (query === '') return

      try {
        //reset states
        setIsLoading(true)
        setError('')
        setGroupList([])
        setEmptyResult(false)

        setTimeout(() => {
          const groupsDummyData = [
            {
              name: 'group1',
              email: 'group1@pvp-test-domain2.com',
              members: 50,
              hasExternalMembers: true,
              restrictFromLeaving: true,
              emailAliases: ['group1@sub.pvp-test-domain2.com', 'group1@alias.pvp-test-domain2.com'],
              settings: [],
            },
            {
              name: 'group2',
              email: 'group2@pvp-test-domain2.com',
              members: 100,
              hasExternalMembers: false,
              restrictFromLeaving: false,
              emailAliases: ['dev@pvp-test-domain2.com', 'group2@alias.pvp-test-domain2.com'],
              settings: [],
            },
            {
              name: 'group3',
              email: 'group3@pvp-test-domain2.com',
              members: 10,
              hasExternalMembers: true,
              restrictFromLeaving: false,
              emailAliases: ['group3@alias.pvp-test-domain2.com'],
              settings: [],
            },
          ]

          console.log('groupsDummyData', groupsDummyData)
        })
      } catch (error) {
        setError(error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchGroupsTable()

    // Abort the API call when the component unmounts
    return function () {
      controller.abort()
    }
  }, [query])
  return (
    <div style={{ height: emptyResult && `calc(100vh - 288px)` }} className="mx-8 mb-6">
      {/* apply custom height only when emptyResult is displayed(maybe it should also be set when there is an error screen in the future) */}
      <p className="mb-3.5 text-2xl font-medium leading-7">Groups Manager</p>
      <p className="text-lg text-muted-foreground mb-3 leading-5">List groups</p>

      <InputForm query={query} setQuery={setQuery} hiddenClass={hiddenClass} groupList={groupList} />
      {isLoading && <Loader />}
      {!isLoading && !error && query && (
        <TopPanel query={query} hiddenClass={hiddenClass} setHiddenClass={setHiddenClass} groupList={groupList} />
      )}
      {!isLoading && !error && groupList.length > 0 && <div>Placeholder for the table</div>}
      {error && <ErrorMessage message={error.message} />}
      {emptyResult && <EmptyResult />}
    </div>
  )
}

export default GroupsManager

function InputForm({ query, setQuery, hiddenClass, groupList }) {
  // Define the schema with Zod
  const FormSchema = z.object({
    query: z.string(),
  })

  // Initialize the form using react-hook-form and Zod resolver for validation
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: '',
    },
  })

  function onSubmit(data) {
    setQuery(data.query)
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={hiddenClass}>
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className={`text-muted-foreground ${groupsStyles.searchBarWidth} `}
                  type="string"
                  name="query"
                  placeholder="Enter a group name or group email address"
                  hasIcon={true}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-x-4 my-6">
          <Button className={`${groupsStyles.buttonPadding}`} type="submit">
            Go
          </Button>
        </div>
      </form>
    </Form>
  )
}

/**
 * A simple loader component that displays a loading message.
 *
 * @returns {JSX.Element} The JSX element containing the loading message.
 */

function Loader() {
  return <p>Loading...</p>
}

/**
 * A component that displays an error message.
 *
 * @param {{ message: string }} props The props object.
 * @prop {string} message The error message to display.
 *
 * @returns {JSX.Element} The JSX element containing the error message.
 */
function ErrorMessage({ message }) {
  return <p>{message}</p>
}

function EmptyResult() {
  return (
    <div className={`${groupsStyles.roundBorder} w-full h-full mt-3 pb-7 flex flex-col items-center justify-center`}>
      <SearchIcon size={116} className="text-muted-foreground" />
      <p className="text-2xl font-medium leading-10">There are no matching results</p>
      <p className="text-xs leading-6">Try another search, or find items by changing your filters.</p>
    </div>
  )
}

function TopPanel({ query, hiddenClass, setHiddenClass }) {
  return (
    <div className={`flex items-center justify-between ${hiddenClass === 'hidden' ? '' : 'hidden'}`}>
      <div className={`py-3 px-4`}>
        <span className={`text-sm my-3 py-1 px-3 ${groupsStyles.roundBorder} ${groupsStyles.thinShadow}`}>
          Showing search result of <span className="font-semibold">{`'${query}'`}</span>
        </span>
      </div>
      <div className="flex flex-col lg:flex-row gap-x-4">
        <Button
          className={`${groupsStyles.buttonPadding}`}
          onClick={() => {
            if (hiddenClass === 'hidden') {
              setHiddenClass('')
            }
          }}
        >
          Refine search conditions
        </Button>
      </div>
    </div>
  )
}
