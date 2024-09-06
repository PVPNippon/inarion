// src/contexts/ValueContext.js
import React, { createContext, useState } from 'react';

export const ValueContext = createContext();

export const ValueProvider = ({ children }) => {
  const [email, setEmail] = useState('');

  return (
    <ValueContext.Provider value={{ email, setEmail }}>
      {children}
    </ValueContext.Provider>
  );
};
