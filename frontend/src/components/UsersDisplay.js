// src/components/UsersDisplay.js
import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../contexts/ValueContext';

const UsersDisplay = () => {
  const { email } = useContext(UserContext); 
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!email) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:4000/user/get-admins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }), 
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        console.log(data);
        setUsers(JSON.stringify(data, null, 2));
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [email]);

  return (
    
    <div>
      <h2>Users List</h2>
      <p>{email}</p>
      {/* <pre>{users}</pre> */}

      {loading && <p>Loading users...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default UsersDisplay;
