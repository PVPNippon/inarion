"use client";
import Link from "next/link";
import { ValueProvider } from "./ui/contexts/ValueContext";
import { LoggedInUserProvider } from "./ui/contexts/LoggedInUserContext";
import RegisteOrLogin from "./ui/components/RegisterOrLoginForm";
import OAuthCallback from "./ui/components/OAuthCallback";
import ProjectDisplay from "./ui/components/ProjectDisplay";
import Result from "./ui/components/Result";
import LoggedInUserDetails from "./ui/components/LoggedInUserDetails";
import FileSettings from "./ui/components/FileSettings";
import ListDomainUsers from "./ui/components/ListDomainUsers";
import HomePage from "./ui/components/HomePage";
import NumberDisplay from "./ui/components/NumberDisplay";
import ListMyDriveFiles from "./ui/components/ListMyDriveFiles";

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
          </nav>
          <RegisteOrLogin></RegisteOrLogin>
        </main>
      </LoggedInUserProvider>
    </ValueProvider>
  );
}
