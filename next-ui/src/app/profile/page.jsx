import GetUserEmail from "../ui/serveractions/GetUserEmail";
export const dynamicParams = false;

export default async function Profile() {
  const email = await GetUserEmail();
  return (
    <div>
      <h1>Profile</h1>
      {email && <p>You are logged in as {email.value}</p>}
    </div>
  );
}
