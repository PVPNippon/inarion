'use client'
import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';

import axios from 'axios';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';
import GetUserEmail from '../serveractions/GetUserEmail';

function ListDomainUsers() {

    const [usersList, setUsersList] = useState([]);
    const { email} = useContext(LoggedInUserContext);
    // const email = GetUserEmail();

    useEffect(()=>{
        const fetchDomainUsers = async (req, res) =>{
            const response = await axios.post('http://localhost:4000/users/users-list', {
                userEmail : email, 
            }, {withCredentials: true},
        );
        console.log("response.data", response.data);

            setUsersList(response.data);
        };
    fetchDomainUsers();
    }, [email]);

    return(
        <div>
            {JSON.stringify(usersList)}
        </div>
    );
}

export default ListDomainUsers;