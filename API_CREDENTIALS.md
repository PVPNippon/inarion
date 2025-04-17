# Steps to obtain the API keys and OAuth 2.0 credentials

## Preparation:

1. Create a [new GCP project](https://developers.google.com/workspace/guides/create-project) which will host the Inarion provider application.
2. Enable “Cloud Resource Manager API” and “Identity and Access Management (IAM) API” in the project you created:

#### Go to the Google Cloud Console:

- Open your web browser and navigate to the Google Cloud Console.
- Make sure you are logged in with the Super Admin Google account.

#### Select your project created in Step1:

- At the top of the page, ensure the correct GCP project (the one where you want to enable the API) is selected in the project selector dropdown menu.

#### Navigate to the API Library:

- Click the Navigation menu (the hamburger icon ☰) in the top-left corner.
- Hover over or click on "APIs & Services".
- In the sub-menu, click on "Library".

#### Search for the API:

- In the API Library search bar (which usually says "Search for APIs & Services"), type: Cloud Resource Manager API
- Press Enter or wait for the search results to appear.

#### Select the API:

- Click on the "Cloud Resource Manager API" card from the search results. This will take you to the details page for this specific API.

#### Enable the API:

- On the Cloud Resource Manager API page, click the blue "ENABLE" button.
- Wait a few moments for Google Cloud to enable the API for your selected project.

#### Repeat the same steps for “Identity and Access Management (IAM) API”.

## Steps to issue API key:

#### Navigate to Service Accounts:

- Select the project from step1 at the top of the GCP console.
- In the navigation menu (☰), go to IAM & Admin -> Service Accounts.

#### Create Service Account:

- Click + CREATE SERVICE ACCOUNT.
- Enter a Service account name (e.g., my-admin-service-account). The Service account ID will be generated automatically (you can edit it).
- Add an optional Description.
- Click CREATE AND CONTINUE.

#### Grant Access:

- Click the Select a role dropdown.
- In the filter, type Owner.
- Select the Basic -> Owner role (roles/owner).
- Click CONTINUE.

#### Grant User Access :

- In “Service account admin role” type the email address of the Super Admin.
- Click DONE.

#### Obtain service account keys:

- Click on the newly created service account in the service account list.
- In the service account details page, click on the KEYS tab.
- Click the ADD KEY dropdown button.
- Select Create new key.
- Ensure JSON is selected as the key type.
- Click CREATE.
- Save the downloaded JSON file to a secure location. You will need it later.

## Steps to issue OAuth 2.0 credentials:

\*Make sure you have selected the project from Step1 using the project selector dropdown at the top of the page.

#### Configure OAuth Consent Screen:

1. Navigate to APIs & Services > OAuth consent screen:
2. Click on GET STARTED
3. Fill in App Information, then click NEXT:

- App name: The name shown to users on the consent screen.
- User support email: super admin email address.

4. In “Audience” select user type: EXTERNAL, then click NEXT
5. In “Contact Information” fill in the email address for Google to contact you, then click NEXT
6. In “Finish” check the “I agree to the Google API Services: User Data Policy” checkbox and click CONTINUE
7. Finally, click CREATE
8. Add test users:

- In the left-side menu select “Audience”
- Under “Test users” title, click ADD USERS
- Fill in the super admin email addresses.

9. Create OAuth Client ID:

- In the left-side menu select “Clients”
- Click the "+ CREATE CLIENT" button at the top.

10. Configure the Client ID:

- Application type: Select "Web application" from the dropdown list.
- Name: Give your Client ID a descriptive name. This is for your reference within the Cloud Console.
- Authorized JavaScript origins: Click +ADD URI and enter following URI:

  `http://localhost:3000`

- Authorized redirect URIs: Enter following URIs:

  `http://localhost:3000/oauth2callback`

  `http://localhost:4000/oauth2callback`

  `http://localhost:4000/auth/oauth2callback`

  `http://localhost:4000/project/create-project`

  `http://localhost:4000/project/initiate-project`

  `http://localhost:4000/google/auth/oauth2callback`

- Click "+ ADD URI" for each redirect URI you need.

11. Create:

- Once you have filled in the necessary details (Name, Origins, Redirect URIs), click the "CREATE" button.

12. Get Your Credentials:

- A pop-up window will appear displaying your "Your Client ID" and "Your Client Secret".
- Important: Copy both the Client ID and the Client Secret, you will need to put them into `.env` file later.
- Click "OK" to close the pop-up.
