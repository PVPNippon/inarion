/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import DeleteMembersViaCsvDialog from '@/app/ui/components/DeleteMembersViaCsvDialog'

/**
 * A temporary component to call the dialog window component for deleting multiple members from a group using a CSV file.
 *
 * This component allows the user to enter a group's email address and
 * utilizes the `DeleteMembersViaCsvDialog` to manage the deletion process.
 *
 * States:
 * - `inputValue`: Stores the group email address entered by the user.
 *
 * @returns {JSX.Element} The rendered component for deleting multiple members from a group.
 */

function DeleteMembersViaCsv2() {
  const [groupName, setGroupName] = useState('')
  const [groupEmail, setGroupEmail] = useState('')

  return (
    <div className="ms-5">
      <h1 className="my-6 font-semibold">Delete multiple members from a group by CSV</h1>
      <h2 className="mb-4 text-orange-500"> Imitate group2</h2>
      <div className="flex w-full max-w-3xl items-center space-x-2 mb-7">
        <Input
          type="email"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter a group name"
          className="text-black"
        />
        <Input
          type="email"
          value={groupEmail}
          onChange={(e) => setGroupEmail(e.target.value)}
          placeholder="Enter a group email address"
          className="text-black"
        />
      </div>
      {<DeleteMembersViaCsvDialog groupName={groupName} groupEmail={groupEmail} />}
    </div>
  )
}
export default DeleteMembersViaCsv2
