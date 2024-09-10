'use client'
import React, { createContext, useState, useEffect } from 'react';

export const NumContext = createContext();

export const NumProvider = ({children}) =>{

    const [contextNum, setContextNum] = useState(0);

    useEffect(()=>{}, [contextNum]);

    return (
        <NumContext.Provider value={{ contextNum, setContextNum }}>
          {children}
        </NumContext.Provider>
      );
}
