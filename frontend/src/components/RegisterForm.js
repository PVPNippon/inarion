import React, { useState, useContext } from 'react';
import axios from 'axios';


const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [authUrl, setAuthUrl] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:4000/auth/register', {
        email,
        projectName,
      });
      setAuthUrl(response.data.authUrl);
    } catch (error) {
      console.error('Error fetching auth URL:', error);
    }
  };

  return (
    
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          placeholder="Email"
          required
        />
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Project Name"
          required
        />
        <button type="submit">Get Auth URL</button>
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
};

export default RegisterForm;
