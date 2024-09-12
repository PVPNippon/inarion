"use client";
import React, { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LoggedInUserContext } from "../ui/contexts/LoggedInUserContext";
import ClearAllCookies from "../ui/serveractions/ClearAllCookies";

function Logout() {
  const { setEmail } = useContext(LoggedInUserContext) || ""; // Access the context to clear email
  const navigate = useRouter();

  //TO DO: I'm getting an error in console that logoutUser() is not a function, however there is an affirmative response from backend that logout is successful.
  //Also, the logout appears to be successful in the browser too.
  //I (Maria) changed the order of execution so that the screen is redirected to the registration page. (swapped navigate.push and setEmail )
  //We need to find out why the error is happening and fix it.
  //However, we will probably switch to server-side rendering and won't use useEffect and contexts etc here.
  //So, first investigate how to rewrite the code for server-side rendering. If it's impossible, investigate the error and improve the existing code.

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
          // Redirect to the registration page
          navigate.push("/");
          //Clear all cookies(test)
          ClearAllCookies;
          // Clear the email in context
          setEmail("");
        } else {
          console.error("Failed to logout");
        }
      } catch (error) {
        console.error("Error during logout:", error);
      }
    };

    logoutUser();
  }, [setEmail, navigate]);

  return (
    <div>
      <h2>Logging out...</h2>
    </div>
  );
}

export default Logout;
