"use client";
import Link from "next/link";
import { ValueProvider } from "../../app/ui/contexts/ValueContext";
import { LoggedInUserProvider } from "../../app/ui/contexts/LoggedInUserContext";
import RegisteOrLogin from "../../app/ui/components/RegisterOrLoginForm";
import OAuthCallback from "../../app/ui/components/OAuthCallback";
import ProjectDisplay from "../../app/ui/components/ProjectDisplay";
import Result from "../../app/ui/components/Result";
import LoggedInUserDetails from "../../app/ui/components/LoggedInUserDetails";
import FileSettings from "../../app/ui/components/FileSettings";
import ListDomainUsers from "../../app/ui/components/ListDomainUsers";
import HomePage from "../../app/ui/components/HomePage";
import NumberDisplay from "../../app/ui/components/NumberDisplay";
import ListMyDriveFiles from "../../app/ui/components/ListMyDriveFiles";

export default function Page() {
  return (
    <ValueProvider>
      <LoggedInUserProvider>
        <main>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/register">Register</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/mydrive-files">List My Drive Files</Link>
            <Link href="/users">List All Users</Link>
            <Link href="/home-page">Home Page</Link>
            <Link href="/logout">Logout</Link>
          </nav>
          <RegisteOrLogin></RegisteOrLogin>
        </main>
      </LoggedInUserProvider>
    </ValueProvider>
  );
}
