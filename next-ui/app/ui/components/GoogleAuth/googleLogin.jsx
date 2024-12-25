'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode' // Make sure jwt-decode is installed
// import { saveToken } from '@/utils/auth' // Replace with your token saving logic
const GoogleLoginButton = () => {
  const router = useRouter()

  const handleLogin = async () => {
    try {
      // Step 1: Get Google login URL
      const { data } = await axios.get(`http://localhost:4000/google`)
      const googleLoginUrl = data.url

      // Step 2: Open login popup
      const newWindow = window.open(googleLoginUrl, '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes')

      // Step 3: Listen for the message from the popup
      window.addEventListener('message', async (event) => {
        console.log('Received message from popup:', event.data)
        console.log('Origin:', event.origin)

        if (event.origin !== 'http://localhost:4000') return // Ensure message comes from a trusted origin
        console.log('Origin matched!')
        const { token } = event.data

        if (token) {
          console.log('Token:', token)
          newWindow.close()

          // Step 4: Validate the token on the backend
          const isValid = await validateToken(token)

          if (isValid) {
            // Step 5: Decode the token to extract user details
            const decodedUser = jwtDecode(token)
            console.log('Decoded User:', decodedUser)

            // Step 6: Redirect to a protected route
            router.push('/groups')
          } else {
            console.error('Token validation failed')
            alert('Token is invalid or expired')
          }
        }
      })
    } catch (error) {
      console.error('Error during login:', error.message)
    }
  }

  const validateToken = async (token) => {
    try {
      const response = await axios.post('http://localhost:4000/google/validate-token', { token })
      return response.data.valid
    } catch (error) {
      console.error('Error validating token:', error.message)
      return false
    }
  }

  return <button onClick={handleLogin}>Login with Google</button>
}

export default GoogleLoginButton
