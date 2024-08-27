// src/Form.js
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ValueContext } from '../contexts/ValueContext';

const Form = () => {
  const [inputValue, setInputValue] = useState('');
  const { setValue } = useContext(ValueContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setValue(inputValue);
    navigate('/result');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter something"
      />
      <button type="submit">Save</button>
    </form>
  );
};

export default Form;
