import React, { useState, useContext } from 'react';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { NumContext } from '../contexts/NumContext';

function RegisteOrLogin() {
  const { email, setEmail } = useContext(LoggedInUserContext); // Access context values
  // const [inputNumber, setInputNumber] = useState(number); // Local state for the input, initialized with context value
  const [inputEmail, setInputEmail] = useState(email); // Local state for adminEmail
  const [projectName, setProjectName] = useState('');
  const [authUrl, setAuthUrl] = useState('');

  const { contextNum, setContextNum} = useContext(NumContext);
  const [num, setNum] = useState(0);
  const navigate = useNavigate(); // Hook to navigate between routes

  const handleSubmit = async (e) => {
    console.log('Inside Submit');
    e.preventDefault();
    setEmail(inputEmail); // Store the adminEmail in context
    // navigate('/display'); // Navigate to the display page
    setContextNum(num);

    try {
      const response = await axios.post('http://localhost:4000/auth/register', {
        email,
        projectName,
      });
      setAuthUrl(response.data.authUrl);
      console.log(email);
    } catch (error) {
      console.error('Error fetching auth URL:', error);
    }
  };

  return (
    <div>
      <h2>Register or Login with Admin Email</h2>
      <form onSubmit={handleSubmit}>
   
        <input
          type="email"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          placeholder="Enter admin email"
          required
        />
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Project Name"
          required
        />
        
        <input 
        type="number"
        value={num}
        onChange={(e) => setNum(e.target.value)}
        />
      
        <button type="submit">Login</button>
      </form>
      {authUrl && (
        <div>
          <p>Click the link below to authorize the application:</p>
          <a href={authUrl} target="_blank" rel="noopener noreferrer">
            Authorize
          </a>
        </div>
      )}
      { num && (<div>
        <p>This is the value for num: {num}</p>
      </div>)}
    </div>
  );
}

export default RegisteOrLogin;
