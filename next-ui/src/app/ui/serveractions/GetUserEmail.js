'use server'
import {cookies } from 'next/headers';

export default async function GetUserEmail() {
    const cookieStore = cookies();
    return cookieStore.get('email');
}