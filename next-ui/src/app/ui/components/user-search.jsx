/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import { useState, useEffect, use } from 'react'
import {
  fetchAllUsers,
  createOUListForFilter,
  createDomainListForFilter,
  createGroupListForFilter,
  createRoleListForFilter,
} from './usersApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import UserResultsTable from './user-table'

const UserSearchBar = () => {
  return (
    <div>
      <div className="flex flex-wrap items-center mt-6 justify-between gap-6">
        <div className="w-full lg:w-1/3 grow">
          <Input type="text" hasIcon={true} placeholder="Enter a user's name or email address" />
        </div>
      </div>
    </div>
  )
}

const Filters = () => {
  const userEmail = localStorage.getItem('email')
  const [orgUnitPath, setOrgUnitPath] = useState('')
  const [domain, setDomain] = useState('')
  const [isEnrolledIn2Sv, setIsEnrolledIn2Sv] = useState('')
  const [isEnforcedIn2Sv, setIsEnforcedIn2Sv] = useState('')
  const [group, setGroup] = useState('')
  const [role, setRole] = useState('')

  const [filteredUsers, setFilteredUsers] = useState('')
  const [ouFilter, setOuFilter] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Fetch all user by default
  // useEffect(() => {
  //   fetchAllUsers(userEmail).then((data) => {
  // console.log(data)
  //   })
  // })

  // Create filter options
  // for OUs
  useEffect(() => {
    createOUListForFilter(userEmail).then((data) => {
      setOuFilter(data)
    })
  }, [])

  // for domains
  useEffect(() => {
    createDomainListForFilter(userEmail).then((data) => {
      setDomainFilter(data)
    })
  }, [])

  // for groups
  useEffect(() => {
    createGroupListForFilter(userEmail).then((data) => {
      setGroupFilter(data)
    })
  }, [])

  // for roles
  useEffect(() => {
    createRoleListForFilter(userEmail).then((data) => {
      setRoleFilter(data)
    })
  }, [])

  // Filter section
  const OrgUnitPathFilter = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="select" className="w-auto">
            {orgUnitPath ? `OU: ${orgUnitPath}` : 'Organizational Unit'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Search for a user" />
            <CommandGroup heading="Suggestions">
              <CommandList>
                {ouFilter.length > 0 ? (
                  ouFilter.map((ou) => (
                    <CommandItem key={ou} onSelect={() => setOrgUnitPath(ou)}>
                      {ou}
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

  const DomainFilter = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="select" className="w-auto">
            {domain ? `Domain: ${domain}` : 'Domain'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Search for a user" />
            <CommandGroup heading="Suggestions">
              <CommandList>
                {domainFilter.length > 0 ? (
                  domainFilter.map((domain) => (
                    <CommandItem key={domain} onSelect={() => setDomain(domain)}>
                      {domain}
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

  const IsEnrolledIn2SvFilter = () => {
    return (
      <Select value={isEnrolledIn2Sv} onValueChange={setIsEnrolledIn2Sv}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="Enrolled in 2-step verification?" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="yes">2SV enrolled: Yes</SelectItem>
            <SelectItem value="no">2SV enrolled: No</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const IsEnforcedIn2SvFilter = () => {
    return (
      <Select value={isEnforcedIn2Sv} onValueChange={setIsEnforcedIn2Sv}>
        <SelectTrigger className="w-auto">
          <SelectValue placeholder="2-step verification enforced?" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="yes">2SV enforced: Yes</SelectItem>
            <SelectItem value="no">2SV enforced: No</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const GroupFilter = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="select" className="w-auto">
            {group ? `Group: ${group}` : 'Group'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Search for a user" />
            <CommandGroup heading="Suggestions">
              <CommandList>
                {groupFilter.length > 0 ? (
                  groupFilter.map((group) => (
                    <CommandItem key={group} onSelect={() => setGroup(group)}>
                      {group}
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

  const RoleFilter = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="select" className="w-auto">
            {role ? `Role: ${role}` : 'Role'}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Search for a user" />
            <CommandGroup heading="Suggestions">
              <CommandList>
                {roleFilter.length > 0 ? (
                  roleFilter.map((role) => (
                    <CommandItem key={role} onSelect={() => setRole(role)}>
                      {role}
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
  return (
    <div className="w-full relative flex items-center rounded-lg py-2 gap-2 mt-4">
      <>
        <OrgUnitPathFilter />
        <DomainFilter />
        <IsEnrolledIn2SvFilter />
        <IsEnforcedIn2SvFilter />
        <GroupFilter />
        <RoleFilter />
      </>
    </div>
  )
}

const GoButton = ({ setShowResult }) => {
  return (
    <div className="w-full relative flex items-center rounded-lg py-2 gap-[10px] mt-4">
      <Button size="sm" onClick={() => setShowResult(true)}>
        Go
      </Button>
    </div>
  )
}

const Search = ({ showResult, setShowResult }) => {
  return (
    <>
      <span className="text-lg text-muted-foreground">List and manage users in your domains.</span>
      <UserSearchBar />
      <Filters />
      <GoButton setShowResult={setShowResult} />
      <UserResultsTable />
    </>
  )
}

export default Search
