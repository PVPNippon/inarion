'use client'
// src/components/Result.js
import React, { useContext } from 'react';
import { ValueContext } from '../contexts/ValueContext';

const Result = () => {
  const { email } = useContext(ValueContext);

  return (
    <div>
      <h2>Result</h2>
      <p>Email: {email}</p>
    </div>
  );
};

export default Result;
