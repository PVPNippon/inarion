


'use client'
import React, { useState, useContext } from 'react';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';
import axios from 'axios';
import StoreUserEmail from '../serveractions/storeUserEmail';


  /**
   * A React component that renders a form to register a new user or
   * login with an existing user.
   * The form accepts an email and a project name as input.
   * When the form is submitted, an authorization URL is fetched from the server
   * and rendered below the form as a link.
   * The email is stored in the `LoggedInUserContext` when the form is submitted.
   * @returns {React.ReactElement} The JSX element with the form and authorization link.
   */
function RegisteOrLogin() {
  const { email, setEmail } = useContext(LoggedInUserContext); // Access context values
  const [inputEmail, setInputEmail] = useState(email); // Local state for adminEmail
  const [projectName, setProjectName] = useState('');
  const [authUrl, setAuthUrl] = useState('');

  /**
   * Handles form submission by storing the email in the `LoggedInUserContext` and
   * fetching an authorization URL from the server.
   * The authorization URL is then stored in the component's state and rendered
   * below the form as a link.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    console.log('Inside Submit');
    e.preventDefault();
    setEmail(inputEmail); // Store the adminEmail in context
    
  
    try {
      const response = await axios.post('http://localhost:4000/auth/register', {
        email: inputEmail,
        projectName,
      });
      setAuthUrl(response.data.authUrl);
      await StoreUserEmail(email);
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
    </div>
  );
}

export default RegisteOrLogin;