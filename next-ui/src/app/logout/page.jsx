'use client'
import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LoggedInUserContext } from '../ui/contexts/LoggedInUserContext';

function Logout() {
  const { setEmail } = useContext(LoggedInUserContext)|| ''; // Access the context to clear email
  const navigate = useRouter();

  useEffect(() => {
    const logoutUser = async () => {
      try {
        const response = await axios.post('http://localhost:4000/auth/logout', {}, {
          withCredentials: true, // Include cookies in the request if needed
        });

        if (response.status === 200) {
          // Clear the email in context
          setEmail('');
          // Redirect to the registration page
          navigate.push('/');
        } else {
          console.error('Failed to logout');
        }
      } catch (error) {
        console.error('Error during logout:', error);
      }
    };

    logoutUser();
  }, [setEmail, navigate]);

  return (
    <div>
      <h2>Logging out...</h2>
    </div>
  );
}

export default Logout;
