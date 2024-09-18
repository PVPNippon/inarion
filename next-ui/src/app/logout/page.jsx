"use client";
import { LoggedInUserProvider } from "../ui/contexts/LoggedInUserContext";
import Logout from "../ui/components/Logout";
/**
 * Page component for testing the Logout component.
 *
 * This page component wraps the Logout component in the LoggedInUserProvider
 * context, which provides the user's email to be impersonated.
 *
 * @returns {React.ReactElement} The JSX for the page.
 */
export default function LogoutTest() {
  return (
    <LoggedInUserProvider>
      <Logout />
    </LoggedInUserProvider>
  );
}
