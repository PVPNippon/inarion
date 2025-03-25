'use client'
import React, { useState, useEffect } from 'react'
import fetchAllUsers from './usersApi'

// 今使ってません

function ListAllUsers() {
  const [users, setUsers] = useState([])
  const userEmail = localStorage.getItem('email')

  useEffect(() => {
    fetchAllUsers(userEmail).then((data) => {
      setUsers(data)
    })
  }, [])

  return (
    <div>
      {users.map((user) => (
        <div key={user.email}> </div>
      ))}
    </div>
  )
}

export default ListAllUsers
