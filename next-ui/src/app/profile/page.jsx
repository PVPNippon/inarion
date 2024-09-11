import GetUserEmail from '../ui/serveractions/GetUserEmail';

export  default  async function LoginPage() {
    const email = await GetUserEmail();
    return (
        <div>
            <h1>Profile</h1> 
            <p>You are logged in as {email.value}</p>
        </div>
    );
}