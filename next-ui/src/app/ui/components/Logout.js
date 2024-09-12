"use client";
import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LoggedInUserContext } from "../contexts/LoggedInUserContext";
import ClearAllCookies from "../serveractions/ClearAllCookies";

function Logout() {
  const { setEmail } = useContext(LoggedInUserContext); // Access the context to clear email
  const navigate = useRouter();
  
  useEffect(() => {
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
