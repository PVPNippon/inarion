# CHANGELOG.md

## Purpose

This changelog serves as a centralized guide for resolving breaking changes introduced by new updates. Developers must follow the outlined steps before merging their feature branches into the `dev` branch.

## Documentation

Ensure the following files are up-to-date:

- [Updated .env file](https://docs.google.com/spreadsheets/d/1F0s0Q8kT_GC2t23W6UQ3cUlk4Dg2GF2gwSf4UyYvNeM/edit#gid=1477733540)
- [Updated config file](https://docs.google.com/spreadsheets/d/1F0s0Q8kT_GC2t23W6UQ3cUlk4Dg2GF2gwSf4UyYvNeM/edit#gid=1596800285)

---

## Breaking Changes

### January 23, 2025 - Login Changes

**Summary**:

- Changed the HTTP methods and endpoints of group APIs (api/routes/groupsRoutes.js)

**Impact**:

- The corresponding FE code will not work until it is modified to use the new HTTP methods and endpoints.
- decryptRequestMiddleware (api/controllers/crypto/cryptoMiddleware.js) will throw an error for all GET requests to the group APIs.
  It needs to be modified to be transparent to all requests which do not have a body.

---

### January 16, 2025 - Login Changes

**Summary**:

- Removed old Login System
- Fixed Project Name for the client in the project

**Impact**:

- Removed email address and project fields from Login Page
- Added project name to .env

**Steps to Resolve**:

- While loggin in, just click on Login With Google
- The email address will be retrieved automatically from the logged in Workspace Admin account trying to log in
- The project name will be retrieved automatically from the .env variable PROJECT_NAME
- Make sure the project name in the .env is the one you want to use
- As of now, we are using PROJECT_NAME=new-proj

---

### December 24, 2024 - Crypto Changes

**Summary**:

- Updated encryption and decryption logic to support skipping crypto for specific tools like Postman.
- Introduced a configurable `CRYPTO` flag to toggle encryption behavior.

**Impact**:

- There is a new flag `CRYPTO` in the .env
- Requests during dev can bypass encryption/decryption based on this `CRYPTO` flag.
- Maintains secure encryption/decryption workflow for production or front-end requests.
- Simplifies development testing without compromising production security.

**Steps to Resolve**:

1. Set the `CRYPTO` environment variable in your `.env` file:
   - Use `CRYPTO=DISABLE` to bypass encryption for Postman or Insomnia requests.
   - Use `CRYPTO=ENABLE` to enforce encryption for front-end or production scenarios.
2. Restart the server to apply the changes.
3. Ensure you test both encrypted and bypassed scenarios before pushing code to production.

---

### December 20, 2024 - Login Changes

**Summary**:

- The login system has changed due to the new model and the new JWT Authentication system.
- So for now, temporarily, there need to be 2 logins, while attempting to login for the first time.
- PS: This measure is temporary, as the two separate logins will be combined in the next task

**Impact**:

- The new Model requires the User Model to have a non nullable field googleId
- The old login system, where we click the Login button and click on the Authorize link, does not
- create this googleId
- So trying to insert a row in the Users table without the google Id will give an error
- To resolve this, we can't directly use 'Login' at the moment, we have to do 'Login with Google' first
- This measure is temporary, as the two separate logins will be combined in the next task

**Steps to Resolve**:

- When loggin in for the first time, click on Login With Google
- When you login with Google, it creates a row in the Users table
- This step creates the necessary and non nullable field googleId, and also the jwtSecret
- Then go back to the Homepage and click on Login again, entering the desired Project name
- For now, we are using proj-9-5-issue-31
- This step creates the project details, i.e. the service account and the keys etc
- Now you can do everything normally as before

---

### December 19, 2024 - Model Changes

**Summary**: Added new columns to User Model

**Impact**:

- The JWT Secret will be created and stored in the database, againsgt a user's Google Id, everytime a user logs in using Google.

**Steps to Resolve**:

- N/A

---

### December 13, 2024 - Logging Standards

**Summary**: A new logging standard has been implemented to improve log consistency and debugging efficiency.

**Impact**:

- Existing logging functions may be incompatible with the new standard.
- Logging outputs must now follow a specific format.

**Steps to Resolve**:

1. Review the [Logging Guidelines Document](https://docs.google.com/document/d/1d3-CR-62lCgpu_WM859JNiHVFJAOUmZp6FBZHr7ePmo/edit?tab=t.0#heading=h.qb1dgoz6jo20).
2. Refactor existing logging functions to adhere to the guidelines.

---

### December 10, 2024 - Encryption and Decryption

**Summary**: Encryption and decryption workflows have been implemented, affecting all modules handling sensitive data.

**Impact**:

- If keys are not put inside the api directory as per the document below, the code will crash.

**Steps to Resolve**:

1. Review the [Encryption and Decryption Workflow Documentation](https://docs.google.com/document/d/1H2Ihd-EE2cXLGT7UUi_ZfBhMZLT0eI8gTnUXIPAn-M4/edit?tab=t.0#heading=h.4qvdn6nfmvuh).
2. Create specific named folder and put public/private keys inside it.

---

## Important

Developers must resolve all breaking changes and validate their changes locally before creating a pull request for the `dev` branch.
