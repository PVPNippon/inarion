"use client";
import { LoggedInUserProvider } from "../../../app/ui/contexts/LoggedInUserContext";
import ListDomainUsers from "../../../app/ui/components/ListDomainUsers";
export default function Users() {
  return (
    <LoggedInUserProvider>
      <h1>Users here</h1>
      <ListDomainUsers></ListDomainUsers>
    </LoggedInUserProvider>
  );
}
