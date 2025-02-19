'use server'
import { cookies } from 'next/headers';
export default async function ClearAllCookies() {
   await cookies.clear();
}