'use client'
import React, { createContext, useState, useEffect } from 'react';

// // Create the context
export const UserDetailsContext = createContext();

// // Create a provider component
export const UserDetailsProvider = ({ children }) => {
  // Initialize the state from localStorage or use an empty string
  const [userEmail, setUserEmail] = useState(() => {
    return window.localStorage.getItem('userEmail') || '';
  });

  // Save userEmail to localStorage whenever it changes
  useEffect(() => {
    window.localStorage.setItem('userEmail', userEmail);
  }, [userEmail]);

  return (
    <UserDetailsContext.Provider value={{ userEmail, setUserEmail }}>
      {children}
    </UserDetailsContext.Provider>
  );
};
