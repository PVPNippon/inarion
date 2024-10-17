# Workspace Suite

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Steps](#steps)
- [GitHub](#github)
- [Configuration](#configuration)
- [Testing](#testing)
- [Acknowledgements](#acknowledgements)
- [Database Schema](#database-schema)

## Introduction

The Google Workspace Admin Suite is a platform designed to bring extended domain management functionality to GWS Super Admins. This repository hosts the code for that platform.

## Features

- **Audit Logging and Monitoring**  
  Provides detailed logs and real-time monitoring to enhance security oversight.
- **Permission Management**  
  Allows management and modification of permissions for Drive files, Calendar events, and groups.
- **Advanced Reporting**  
  Offers in-depth reports on user activity and domain health.
- **Bulk Actions**  
  Enables automation of actions like updating user roles and applying settings across multiple accounts.
- **Customizable Dashboards**  
  Allows admins to personalize their dashboards with key metrics and tools.
- **Real-Time Alerts**  
  Delivers instant notifications for critical events and activities.
- **Domain Management**  
  Extends control over domain-wide settings and configurations.

Find more about the platform in our [Design doc](https://docs.google.com/document/d/1Isz0NBSpngVcSoMmSf__bOB1ROaTUBx6kXqcV-efljg/edit#heading=h.yeifevu6kuwm).

## Installation

### Prerequisites

Before cloning and reusing this repository, ensure you have the following:

1. **Google Workspace Super Admin Account**  
   Necessary for accessing and managing domain-level settings.\
   Test account credentials document will be provided by the Team members / management.
2. **Google Cloud Platform (GCP) Account**  
   Required for setting up the necessary APIs, including enabling the Google Workspace Admin SDK.\
   You may refer to the previously mentioned credentials document and use the same accounts for GCP console access. Further instructions are provided in the document.

3. **Node.js & npm**  
   Ensure you have Node.js and npm installed for running the backend services.

4. **PostgreSQL Database**  
   A running instance of PostgreSQL is needed for database management. Ensure you have access credentials.

5. **Docker**  
   Download Docker from the [Official website](https://www.docker.com/).

6. **Raspberry Pi** (Optional)\
   A configured Raspberry Pi.

7. **API Credentials**  
   Set up and obtain the necessary API keys and OAuth 2.0 credentials from GCP for Google Workspace API integration.

8. **Git**  
   Version control system for managing the repository and any collaboration.

9. **Environment Variables**  
   Set up environment variables (e.g., API keys, database credentials) as described in the repository’s `.env.example` file.

## Steps

### PostgreSQL Database Installation

1. Download PostgreSQL.
2. Run the installer and keep proceeding "Next" without changing any settings.
   - When the installer asks for the password for root user `postgres`, consult a team member to get the environment variables and common password.

### Database Initialization

1. Once installation is complete, open pgAdmin 4.
2. Open the Local server listed in the pgAdmin sidebar.
3. Right-click on “Databases” and click “Create Database”.
4. Enter the Database name as `testdb` and click Save.
5. Right-click on `testdb` and click "Query Tool".
6. Copy the following [table creation queries](#database-schema) and paste them into the Query Tool.
7. To execute, either press `F5` or click the "Play" button on the query tool.

### GitHub

#### Cloning and configuration

1. Clone the repository:

   ```bash
   git clone https://github.com/<username>/<repository-name>.git
   cd repository-name
   ```

2. Create a folder keys inside the api folder and store the service account key inside.
   • The service account key will be provided by a team member.

#### Running Locally

1. Set Up Environment Variables: Create a .env file with necessary variables (e.g., database credentials, Google OAuth credentials).
2. Start the Application: Build and run using Docker Compose:

```bash
docker-compose up --build
```

3. Access the App: Visit http://localhost:3000 in the browser.

## Configuration

The project uses a `.env` file for configuration:

- `GOOGLE_SERVICE_ACCOUNT_KEY_FILE`: Path to the service account key file for Google API access.
- `GOOGLE_CLIENT_ID`: OAuth2 client ID for Google authentication.
- `GOOGLE_CLIENT_SECRET`: OAuth2 client secret for Google authentication.
- `REDIRECT_URI`: OAuth2 callback URL for redirecting after login.
- `POSTGRES_HOST`: PostgreSQL server IP/hostname.
- `POSTGRES_PORT`: PostgreSQL port (default: 5432).
- `POSTGRES_USER`: PostgreSQL username.
- `POSTGRES_PASSWORD`: PostgreSQL password.
- `POSTGRES_DB`: Name of the PostgreSQL database.
- `JWT_ACCESS_SECRET`: Secret key for signing access tokens.
- `JWT_REFRESH_SECRET`: Secret key for signing refresh tokens.
- `PORT`: App's running port.
- `ORGANIZATION_ID`: Unique organization ID.
- `API_BASE_URL`: Base URL for API requests.

## Miscellaneous

If you followed above steps to install and run the platform locally, you may encouter database connectivity issues in the initial run.\
If you come across such issues, please refer to [this document](https://docs.google.com/document/d/12Etx9WJ9w6M5bPUpyGxPnQLsBm0e71mhPnsXOBGlV04/edit#heading=h.a7ogwbsjg1tn) to solve the connection issue by following the steps to add your Local IP address to the `pg_hba.conf` file

## Testing

**[Section edit To be assigned]**

## Acknowledgements

TBD

## Database Schema

```sql
CREATE SEQUENCE "Users_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS public."Users"
(
    id integer NOT NULL DEFAULT nextval('"Users_id_seq"'::regclass),
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    "projectName" character varying(255) COLLATE pg_catalog."default" NOT NULL,
    tokens jsonb,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL,
    CONSTRAINT "Users_pkey" PRIMARY KEY (id),
    CONSTRAINT "Users_email_key" UNIQUE (email)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Users"
    OWNER to postgres;

--------------------------------------------------------------


CREATE SEQUENCE "Projects_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS public."Projects"
(
    id integer NOT NULL DEFAULT nextval('"Projects_id_seq"'::regclass),
    "projectId" character varying(255) COLLATE pg_catalog."default" NOT NULL,
    "projectName" character varying(255) COLLATE pg_catalog."default" NOT NULL,
    "organizationId" character varying(255) COLLATE pg_catalog."default",
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" integer,
    CONSTRAINT "Projects_pkey" PRIMARY KEY (id),
    CONSTRAINT "Projects_projectId_key" UNIQUE ("projectId"),
    CONSTRAINT "Projects_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES public."Users" (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Projects"
    OWNER to postgres;



-------------------------------------------------------------------

CREATE SEQUENCE "ServiceAccounts_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS public."ServiceAccounts"
(
    id integer NOT NULL DEFAULT nextval('"ServiceAccounts_id_seq"'::regclass),
    "projectId" character varying(255) COLLATE pg_catalog."default",
    "serviceAccountEmail" character varying(255) COLLATE pg_catalog."default" NOT NULL,
    "displayName" character varying(255) COLLATE pg_catalog."default",
    "clientId" character varying(255) COLLATE pg_catalog."default",
    "privateKey" text COLLATE pg_catalog."default",
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceAccounts_pkey" PRIMARY KEY (id),
    CONSTRAINT "ServiceAccounts_serviceAccountEmail_key" UNIQUE ("serviceAccountEmail"),
    CONSTRAINT fk_project FOREIGN KEY ("projectId")
        REFERENCES public."Projects" ("projectId") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."ServiceAccounts"
    OWNER to postgres;

---------------------------------------------------------------------------

CREATE SEQUENCE "ServiceAccountKeys_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;


CREATE TABLE IF NOT EXISTS public."ServiceAccountKeys"
(
    id integer NOT NULL DEFAULT nextval('"ServiceAccountKeys_id_seq"'::regclass),
    "privateKeyId" character varying(255) COLLATE pg_catalog."default",
    "privateKeyData" text COLLATE pg_catalog."default",
    "validAfterTime" timestamp without time zone,
    "validBeforeTime" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "serviceAccountEmail" character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "ServiceAccountKeys_pkey" PRIMARY KEY (id),
    CONSTRAINT "fk_serviceAccount" FOREIGN KEY ("serviceAccountEmail")
        REFERENCES public."ServiceAccounts" ("serviceAccountEmail") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."ServiceAccountKeys"
    OWNER to postgres;
--------------------------------------------------------------------------
------

CREATE SEQUENCE "Tokens_id_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS public."Tokens"
(
    id integer NOT NULL DEFAULT nextval('"Tokens_id_seq"'::regclass),
    "accessToken" text COLLATE pg_catalog."default" NOT NULL,
    "refreshToken" text COLLATE pg_catalog."default",
    scope character varying(255) COLLATE pg_catalog."default",
    "tokenType" character varying(255) COLLATE pg_catalog."default",
    "expiryDate" bigint,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "userId" integer NOT NULL,
    CONSTRAINT "Tokens_pkey" PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public."Tokens"
    OWNER to postgres;
```

## Team Contact Information

Email : project-wssuite@pvp.co.jp
