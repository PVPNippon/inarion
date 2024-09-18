

"use client";
import { LoggedInUserProvider } from "../ui/contexts/LoggedInUserContext";
import LoggedInUserDetails from "../ui/components/LoggedInUserDetails";
/**
 * Page component for displaying the profile of the currently logged in user.
 *
 * This page component displays a heading with the text "Profile" and
 * a component that shows the email address of the currently logged in user.
 *
 * @returns {React.ReactElement} The JSX for the page.
 */
export default function Profile() {
  return (
    <LoggedInUserProvider>
      <h1>Profile</h1>
      <LoggedInUserDetails />
    </LoggedInUserProvider>
  );
}