import React, { useContext } from 'react';
import { ValueContext } from '../contexts/ValueContext';

const Result = () => {
  const { value } = useContext(ValueContext);

  return (
    <div>
      <h1>Stored Value:</h1>
      <p>{value}</p>
    </div>
  );
};

export default Result;
