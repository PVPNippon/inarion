"use client";
import { LoggedInUserProvider } from "../ui/contexts/LoggedInUserContext";
import ListDomainUsers from "../ui/components/ListDomainUsers";
export default function Users() {
  return (
    <LoggedInUserProvider>
      <h1>Users here</h1>
      <ListDomainUsers></ListDomainUsers>
    </LoggedInUserProvider>
  );
}
