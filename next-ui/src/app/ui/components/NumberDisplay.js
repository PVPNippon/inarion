'use client'
import React, { useContext } from 'react';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';

/**
 * A React component that displays the stored number and admin email.
 *
 * @returns {JSX.Element} A React component that displays the stored number and admin email.
 */
function NumberDisplay() {
  const { number, adminEmail } = useContext(LoggedInUserContext); // Get the stored number and adminEmail from context

  return (
    <div>
      <h2>Display Numbersss</h2>
      <p>Stored Number: {number}</p> {/* Display the stored number */}
      <p>Admin Email: {adminEmail}</p> {/* Display the stored admin email */}
    </div>
  );
}

export default NumberDisplay;
