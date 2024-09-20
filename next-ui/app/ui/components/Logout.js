"use client";
import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LoggedInUserContext } from "../contexts/LoggedInUserContext";
import ClearAllCookies from "../serveractions/ClearAllCookies";

/**
 * A React component that performs a logout action.
 *
 * This component makes a POST request to the server's logout API endpoint,
 * which clears the user's session and cookies. It then clears the user's email
 * from the context and redirects to the registration page.
 *
 * @returns {React.ReactElement} A React element with a heading that says "Logging out..."
 */
function Logout() {
  const { setEmail } = useContext(LoggedInUserContext); // Access the context to clear email
  const navigate = useRouter();
  
  useEffect(() => {
    /**
     * Logs out the user by making a POST request to the server's logout API
     * endpoint, which clears the user's session and cookies. It then clears the
     * user's email from the context and redirects to the registration page.
     *
     * The request is made with the user's session cookie, which is used to
     * authenticate the request and clear the user's session.
     *
     * If the request is successful, it clears the user's email from the context
     * and redirects to the registration page. If the request fails, it logs an
     * error message to the console.
     *
     * @returns {Promise<void>} A promise that resolves when the user has been
     * logged out.
     */
    const logoutUser = async () => {
      try {
        const response = await axios.post(
          "http://localhost:4000/auth/logout",
          {},
          {
            withCredentials: true, // Include cookies in the request if needed
          }
        );
        if (response.status === 200) {
          //Clear all cookies(test)
          ClearAllCookies;
          // Clear the email in context
          setEmail("");
          // Redirect to the registration page
          navigate.push("/");
        } else {
          console.error("Failed to logout");
        }
      } catch (error) {
        console.error("Error during logout:", error);
      }
    };

    logoutUser();
  }, [setEmail, navigate]);

  return <h2>Logging out...</h2>;
}

export default Logout;
