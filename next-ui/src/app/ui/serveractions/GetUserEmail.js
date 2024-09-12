"use server";
import { cookies } from "next/headers";

/**
 * Retrieves the user's email address from the 'email' cookie.
 * @returns {string|null} The user's email address if found, or null if not found.
 */
export default async function GetUserEmail() {
  const cookieStore = cookies();
  return cookieStore.get("email");
}
