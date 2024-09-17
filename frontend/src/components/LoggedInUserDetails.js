import React, { useContext } from 'react';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';

function LoggedInUserDetails() {
  const { email } = useContext(LoggedInUserContext); // Get the stored number and adminEmail from context

  return (
    <div>
      <p>Admin Email curentlky logged in: {email}</p> {/* Display the stored admin email */}
    </div>
  );
}

export default LoggedInUserDetails;
