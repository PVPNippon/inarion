//Commented out below is alternative method which retrieves user email from cookies, not context.
//I will leave it here in case we opt for cookies instead of context in the future.
// import GetUserEmail from "../ui/serveractions/GetUserEmail";
// export const dynamicParams = false;

// export default async function Profile() {
//   const email = await GetUserEmail();
//   return (
//     <div>
//       <h1>Profile</h1>
//       {email && <p>You are logged in as {email.value}</p>}
//     </div>
//   );
// }


"use client";
import { LoggedInUserProvider } from "../ui/contexts/LoggedInUserContext";
import LoggedInUserDetails from "../ui/components/LoggedInUserDetails";
export default function Profile() {
  return (
    <LoggedInUserProvider>
      <h1>Profile</h1>
      <LoggedInUserDetails />
    </LoggedInUserProvider>
  );
}