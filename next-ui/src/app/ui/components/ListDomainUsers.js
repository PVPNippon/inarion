"use client";
import React, { useState, useEffect, useContext } from "react";
import Link from "next/link";
import axios from "axios";
import { LoggedInUserContext } from "../contexts/LoggedInUserContext";
import GetUserEmail from "../serveractions/GetUserEmail";

/**
 * A component that fetches a list of users in the domain
 * and displays them as a JSON string.
 *
 * @returns {JSX.Element}
 */
function ListDomainUsers() {
  const [usersList, setUsersList] = useState([]);
  const { email } = useContext(LoggedInUserContext);
  // const email = GetUserEmail(); //an alternative method to fetch user email from cookies

  useEffect(() => {
    /**
     * Fetches a list of users in the domain and updates the component state.
     * The data is fetched with the user's session cookie.
     * @returns {Promise<void>} - Resolves when the data has been fetched and the state has been updated.
     */
    const fetchDomainUsers = async (req, res) => {
      const response = await axios.post(
        "http://localhost:4000/users/users-list",
        {
          userEmail: email,
        },
        { withCredentials: true }
      );
      console.log("response.data", response.data);

      setUsersList(response.data);
    };
    fetchDomainUsers();
  }, [email]);

  return <div>{JSON.stringify(usersList)}</div>;
}

export default ListDomainUsers;
