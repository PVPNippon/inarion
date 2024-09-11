'use server'
import { cookies } from 'next/headers';
export default async function StoreUserEmail(email) {
    const cookieStore = cookies();
    await cookieStore.set('email', email);
}