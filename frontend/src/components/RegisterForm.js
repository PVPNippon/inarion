/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

// src/components/RegisterForm.js
import React, { useState, useContext } from 'react'
import axios from 'axios'
import { ValueContext } from '../contexts/ValueContext'

const RegisterForm = () => {
  const { setEmail } = useContext(ValueContext) // Access the context to set the email
  const [email, setLocalEmail] = useState('') // Local state for email
  const [projectName, setProjectName] = useState('')
  const [authUrl, setAuthUrl] = useState('')

  const handleSubmit = async (e) => {
    setEmail(email) // Store the email in the context

    e.preventDefault()
    setEmail(email) // Store the email in the context

    try {
      const response = await axios.post('http://localhost:4000/auth/register', {
        email,
        projectName,
      })
      setAuthUrl(response.data.authUrl)
      console.log(email)
    } catch (error) {
      console.error('Error fetching auth URL:', error)
    }
  }

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email} // Use local state for the input value
          onChange={(e) => setLocalEmail(e.target.value)} // Update the local state and context
          placeholder="Email"
          required
        />
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Project Name"
          required
        />
        <button type="submit">Get Auth URL</button>
      </form>
      {authUrl && (
        <div>
          <p>Click the link below to authorize the application:</p>
          <a href={authUrl} target="_blank" rel="noopener noreferrer">
            Authorize
          </a>
        </div>
      )}
    </div>
  )
}

export default RegisterForm
