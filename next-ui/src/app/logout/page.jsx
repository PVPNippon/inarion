"use client";
import { LoggedInUserProvider } from "../ui/contexts/LoggedInUserContext";
import Logout from "../ui/components/Logout";
export default function LogoutTest() {
  return (
    <LoggedInUserProvider>
      <Logout />
    </LoggedInUserProvider>
  );
}
