'use server'
import { cookies } from 'next/headers';
/**
 * Stores the user's email address in a cookie.
 * @param {string} email The user's email address.
 * @returns {Promise<void>} A promise that resolves when the cookie has been set.
 */
export default async function StoreUserEmail(email) {
    const cookieStore = cookies();
    await cookieStore.set('email', email);
}