# Inarion 🦊🦊🦊

## Table of Contents

- [Introduction](#introduction)
- [License](#license)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [How to use](#how-to-use)
- [Testing](#testing)
- [Logging](#logging)
- [APIs](#apis)
- [Contributors](#contributors)
- [Contributing](#contributing)
- [Team Contact Information](#team-contact-information)

## Introduction

Inarion is a platform designed to bring extended domain management functionality to GWS Super Admins.  
This project leverages the Google Workspace APIs to provide the more expansive and granular experience that many Google Workspace Domain Admins are looking for.  
The suite is built to streamline administrative tasks, enhance security oversight, and provide in-depth insights into user and domain activity.  
By utilizing the Google Workspace Admin SDK, this platform enables administrators to manage permissions, monitor user activity, and automate bulk actions across multiple accounts.  
The platform is built using a modular architecture, allowing administrators to easily integrate new features and customize the suite to meet their specific needs.  
This repository hosts the code for that platform.

## License

This project is source available under a non-commercial license. For more information, please see our [License](LICENSE.md) file.

## Tech Stack

**Frontend:**

- [React](https://reactjs.org/)
- [Next.js](https://nextjs.org/)

**Backend:**

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)

**Database & Caching:**

- [PostgreSQL](https://www.postgresql.org/) – Relational database
- [Redis](https://redis.io/) – In-memory caching

**Containerization:**

- [Docker](https://www.docker.com/)

**Logging:**

- [Winston](https://github.com/winstonjs/winston)

**Testing:**

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) – Frontend component testing

**Version Control:**

- [Git](https://git-scm.com/)

## Features

- **Audit Logging and Monitoring**  
  Provides detailed logs and monitoring to enhance security oversight.
- **Permission Management**  
  Allows management and modification of permissions for Users, Drive files, and Google Groups.
- **Advanced Reporting**  
  Offers in-depth reports on user and group activity and domain health.
- **Bulk Actions**  
  Enables automation of actions like deleting organization users, removing members from Googele Groups or and applying settings across multiple accounts.
- **Comprehensive Dashboards**  
  Allows admins to display comprehensive user and Google groups-related data..
- **Domain Management**  
  Extends control over domain-wide settings and configurations.

## Installation

### Prerequisites

Before cloning and reusing this repository, ensure you have the following:

1. **Google Workspace Super Admin Account**  
   Necessary for accessing and managing domain-level settings.
2. **Google Cloud Platform (GCP) Account**  
   Required for setting up the necessary [APIs](#apis), including enabling the Google Workspace Admin SDK.\
   You should use the super admin account to use the same accounts for GCP console access. Further instructions are provided in the document.

3. **Node.js & npm**  
   Ensure you have Node.js and npm installed for running the backend services.

4. **PostgreSQL Database**  
    A running instance of PostgreSQL is needed for database management. Ensure you have access credentials.
   While our internal development setup often runs the database on a Raspberry Pi, you can host your database instance anywhere you like (e.g., locally, on a dedicated server, or using a cloud provider).  
   The application connects to the database using the following environment variables. Make sure these are set correctly in the environment where you run the project, pointing to your database instance:

- POSTGRES_HOST: IP address of your database server.
- POSTGRES_PORT: The port number PostgreSQL is listening on (usually 5432).
- POSTGRES_USER: The username for database access. (default postgres)
- POSTGRES_PASSWORD: The password for the database user.
- POSTGRES_NAME: The specific database name to use.

5. **Docker**  
   Download Docker from the [Official website](https://www.docker.com/).

6. **API Credentials**  
   Set up and obtain the necessary API keys and OAuth 2.0 credentials from GCP for Google Workspace API integration following [these instructions](API_CREDENTIALS.md).
7. **Git**  
   Version control system for managing the repository and any collaboration.

8. **HTTP Client**  
   As most of features are not available in UI, you will need a http client like Postman(link) or Insomnia(link) to send requests to the backend server `http://localhost:4000/`

### PostgreSQL Database Installation

1. Download PostgreSQL.
2. Run the installer and keep proceeding "Next" without changing any settings.

### Database Initialization

1. Once installation is complete, open pgAdmin 4.
2. Open the Local server listed in the pgAdmin sidebar.
3. Right-click on “Databases” and click “Create Database”.
4. Enter the Database name as `testdb` and click Save.
5. Right-click on `testdb` and click "Query Tool".
6. Copy the following [table creation queries](database_schema.sql) and paste them into the Query Tool.
7. To execute, either press `F5` or click the "Play" button on the query tool.

### GitHub

#### Cloning and configuration

1. Clone the repository:

   ```bash
   git clone https://github.com/<username>/<repository-name>.git
   cd repository-name
   ```

2. Create a folder “credentials” inside the `api` folder and a file named `sa-key.json` and store the [service account key](API_CREDENTIALS.md#steps-to-issue-api-key) inside the file.

3. (Optional): Generate [encryption keys](ENCRYPTION_KEYS.md).

#### Running Locally

1. Set Up Environment Variables:

- Create a .env file with necessary variables (e.g., database credentials, Google OAuth credentials).

2. Start the Application:

- Build and run using Docker Compose:

```bash
docker-compose up --build
```

3. Access the App:

- Visit `http://localhost:3000` in the browser.

4. Login with the superadmin account:

- Click on “Login with google”
- Click “Continue”
- Check all boxes in the User consent screen and click “Allow”

5. In your database, confirm that user and project data have been added to `Users`, `ServiceAccounts`, `ServiceAccountKeys` and `Projects` tables. Please note that these Project and Service accounts were created automatically during login and are `not` the same as the ones you created in [Prerequisites](#prerequisites).  
   Note: the new project has been created with the name you indicated in .env in `PROJECT_NAME`.

6. Enable necessary APIs in the newly created project:

- In [Google Cloud Console](https://console.cloud.google.com/), select the newly created project at the top of the console.
- In “quick access”, click on “Enabled APIs and services”(or click on the navigation button at the left top and select “APIs & Services > Enabled APIs and services”).
- Make sure that these APIs are enabled:  
  `Google Drive API`  
  `Admin SDK API`  
  `Drive Activity API`  
  `Groups Settings API`
- If necessary API is missing from the “Enabled APIs and services” list:

  - Click on “+Enable APIs and Services”
  - Type your API’s name in the search bar
  - Select your API from the search result
  - On the API page, click on the “enable” button under the API name

7. Obtain newly-created service account Client ID:

- Sign into Google Cloud Console with the superadmin account:
- From the pulldown list at the top-left of the page, select your project.
- Click on the navigation button at the left top and select “APIs & Services” > “Enabled APIs and services” > “Credentials”.
- In the Credentials page, click on the service account email in the “Service Accounts” section
- Click “Advanced settings”
- In the “Domain-wide Delegation” section, copy the “Client ID”.

8. Enable Domain-wide Delegation and add necessary scopes in [Admin console](https://admin.google.com):

- Log into Admin Console with the superadmin account. From the left-side menu, select “Security” > “Access and data control” > “API controls”
- On the “API controls” page, click on “MANAGE DOMAIN WIDE DELEGATION” in the “Domain wide delegation” section.
- Click “ADD NEW”
- Fill in the Client ID and list following [scopes](#apis), comma-separated:
- Click “AUTHORIZE”

## Configuration

The project uses a `.env` file for configuration, check out the [env.example](.env.example) file for frontend and backend.

## How to use

### User-related features:

#### API Endpoints:

- User Management:

  - GET http://localhost:4000/api/users/: List all users in the customer organization
  - GET http://localhost:4000/api/users/preparations: Retrieves multiple sets of data related to users, organizational units, domains, groups, and role names.

- User Roles and Permissions

  - GET http://localhost:4000/api/users/role/assignments: List all role assignments
  - GET http://localhost:4000/api/users/role/names: List all role names

- User Organization Units

  - GET http://localhost:4000/api/users/orgunits: List all OUs in the customer domain

- User Security

  - POST http://localhost:4000/api/users/2sv-off: Turn off 2-step verification for multiple users

- User Deletion

  - DELETE http://localhost:4000/api/users/: Delete multiple users

#### Features/dev tools implemented in UI:

Link:http://localhost:3000/en/people

- User manager: 
  - allows to set dynamic filters for Organization Units, Domains, Google Groups, Roles, 2-step verification enrollment status and 2-step verification enforcement status. [Screenshot](https://github.com/user-attachments/assets/6bcc2e2d-15f6-4d08-81e5-95bb0dfff7fe)
  - displays a table containing information for all users in the customer organization. The table has the following columns: “Name”, “Email address”, “Organization Unit”, “Enrolled in 2-step verification”, “2-step verification enforced”. [Screenshot](https://github.com/user-attachments/assets/761c3be7-38a7-4a80-b2d4-30767a2f7df8)
  - allows to bulk-delete multiple users by csv (Screenshots: [1](https://github.com/user-attachments/assets/03fe9db3-8469-45c9-9326-dbdf6d69d8fd) and [2](https://github.com/user-attachments/assets/155aaa31-c199-4a4f-8f0f-5dc67781ab7f))
  - allows to turn-of 2-step verification for multiple users by csv

### Groups-related features:

#### API Endpoints:

- Group Management

  - GET http://localhost:4000/api/groups/: List all google groups in the customer organization
  - GET http://localhost:4000/api/groups/group/:groupEmail: Get a google group by its email
  - POST http://localhost:4000/api/groups/: Create a google group or multiple google groups

- Group Members

  - GET http://localhost:4000/api/groups/group/:groupEmail/members: List members of a group
  - POST http://localhost:4000/api/groups/group/:groupEmail/members: Add members to a group
  - POST http://localhost:4000/api/groups/members/export: List members of groups in CSV format
  - DELETE http://localhost:4000/api/groups/group/:groupEmail/members: Delete multiple members from a group
  - DELETE http://localhost:4000/api/groups/members/member/:memberEmail: Delete a member from multiple groups

- Group Activity Logs

  - GET http://localhost:4000/api/groups/activities: Get group activity logs (all group logs for all groups in the customer organization)
  - GET http://localhost:4000/api/groups/joined-activities: Get group joined activity logs (all "add_member" and "accept_invitation" logs for all groups in the customer organization)

- Group Hierarchy and Membership

  - GET http://localhost:4000/api/groups/target/:targetEmail/hierarchy: Get group hierarchy relative to a group (or potentially a user in the future)
  - GET http://localhost:4000/api/groups/target/:targetEmail/nested-table: Get nested membership table for an entity (group or user)

- Group Settings
  - GET http://localhost:4000/api/groups/group/:groupEmail/settings: Get a group's settings
  - PUT http://localhost:4000/api/groups/group/:groupEmail/settings: Update a group's settings

#### Features/dev tools implemented in UI:

Link: `http://localhost:3000/en/groups`

- “Dev tools” tab:

  - Create a new google group
  - Create multiple groups from a csv file
  - Create multiple groups with serial-like numbers
  - Add members to a group by from a csv file

- “Features” tab:

  - Export a csv with member detail for a group/multiple groups
  - Remove multiple members from a group by CSV

    Screenshots:
    [1](https://github.com/user-attachments/assets/4fe30bc0-6723-448c-bae8-01344a861343)
    [2](https://github.com/user-attachments/assets/49ed1ffb-3497-4d17-a0c6-e29e3c461e5d)
    [3](https://github.com/user-attachments/assets/abe1563d-7b9d-4817-8028-ad914c05f5f9)

  - Remove a member from multiple groups by CSV

Link: `http://localhost:3000/en/groups/hierarchy`

- Nested group membership:
  displays a table of all groups that a given group or user is a member of, either directly or indirectly.
  The table contains columns for the group email, the type of membership (direct or indirect), and the timestamp of when the membership was created. [Screenshot](https://github.com/user-attachments/assets/484f6452-85dc-4598-b20a-5550a450c6a8)

- Groups hierarchy graph:
  displays a hierarchical representation of related groups for a given member email address

Link: `http://localhost:3000/en/groups/groups_manager`

- Groups manager page(UI only, not connected to backend):
  Allows to set filters to search for groups in the customer organization which matched particular conditions. Displays search result as a table with following columns: Name, Email address, Members, Has external members, Who can leave group, Is admin created, Alias address. Every group row can be expanded and displays detailed information on access settings for the group. Search results can be downloaded as a csv file.  
Screenshots: 
[1](https://github.com/user-attachments/assets/b8a086e3-1140-4eac-a2d7-c074f6ac1491)
[2](https://github.com/user-attachments/assets/20c7924d-5637-40cd-81e4-95cbf2df540c)
[3](https://github.com/user-attachments/assets/0360ffbf-f15a-43e7-bc8d-97d36b3074bc)

### Drive-related features:

#### API Endpoints:

- Shared Drives List

  - GET http://localhost:4000/api/drive/shared-drives: Retrieves a list of all Shared Drives within the customer's domain accessible via admin impersonation.

- File metadata management

  - GET http://localhost:4000/api/drive/all-drives: Retrieves metadata of all the files across all the shared drives and all the user’s personal drives via admin and user impersonation.

- Drive Filters

  - GET http://localhost:4000/api/drive/filters: Retrieves metadata of all the files that match the specific filter as requested by the user using the query parameters.

    Here’s the list of filters that can be used:  
    a) page (integer) - specify the page count  
    b) owner (string) - email address of any user within the domain  
    c) sharedDrive (string) - shared drive ID  
    d)sharedWith (string) - email address of any user including external users  
    e) type (string) - specify type of item eg- file or folder  
    f) visibility (string) - link sharing options on the file, choose any from anyoneCanFind / anyoneWithLink / domainCanFind / domainWithLink / limited  
    g) trashed (boolean) - specify if requested data is trashed or not  
    h) listFilesInsideSharedDrives (boolean) - specify if items are to be fetched from on shared drives or all drives  
    i)onlyListSharedDrives (boolean) - fetch information about the shared drives and not any item’s information  
    j) hasMembers (boolean) - fetch items from shared drives that have members in it, will work ONLY when onlyListSharedDrives is true.  
    k) hasManagers (boolean) - fetch items from shared drives that have managers/organizers in it, will work ONLY when onlyListSharedDrives is true.

- Drive hierarchy structure

  - GET http://localhost:4000/api/drive/drive-structure: Route to build and display a nested structure of an individual shared drive or a user’s personal drive.

    Use the following query parameters to differentiate:  
    a) id (string) - can be email of any user or ID of a shared drive  
    b)driveName (string) - name of the shared drive, will work ONLY when ID of shared drive is provided.

- Direct Path structure
  - GET http://localhost:4000/api/drive/direct-path: Route to build and display a direct path from the specified item to the root folder of either a shared drive or a user’s personal drive.  
    Query parameter used: itemId (string) - ID of an item that is either in a shared drive or a user’s personal drive.

#### Features/dev tools implemented in UI:

N/A

## Testing

Backend - N/A
Frontend - testing-library

## Logging

Winston is used for structured logging with transports for console output and log files (error.log, combined.log). All HTTP requests are logged via Express middleware, and errors are captured through a global error handler. Logs are formatted with timestamps and dumped into the database daily for centralized monitoring and analysis.

## APIs

```'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.domain',
    'https://www.googleapis.com/auth/activity',
    ‘https://www.googleapis.com/auth/drive’,
    'https://www.googleapis.com/auth/drive.activity',
    'https://www.googleapis.com/auth/drive.activity.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    'https://www.googleapis.com/auth/apps.groups.settings',
    'https://www.googleapis.com/auth/admin.directory.user.security',
    'https://www.googleapis.com/auth/admin.directory.rolemanagement',
    'https://www.googleapis.com/auth/admin.directory.orgunit',
```

## Contributors

A list of contributors to this project can be found in [CONTRIBUTORS](CONTRIBUTORS.md) file.

## Contributing

Want to contribute to this project? Please read our [CONTRIBUTING](CONTRIBUTING.md) file to learn how to get started.

## Team Contact Information

Email : [inarion@pvp.co.jp](mailto:inarion@pvp.co.jp)
