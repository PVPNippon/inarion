// config/config.js
require('dotenv').config();

module.exports = {
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  CLIENT_SERVICE_ACCOUNT_EMAIL: process.env.CLIENT_SERVICE_ACCOUNT_EMAIL,
  PORT: process.env.PORT || 4000,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_PORT: process.env.POSTGRES_PORT,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_DB: process.env.POSTGRES_DB,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: "http://localhost:4000/auth/oauth2callback",
  SCOPES: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.domain'
  ],
  USERS_LIST_DIRECTORY:[
    {
      "kind": "admin#directory#user",
      "id": "103446470067503314892",
      "etag": "\"nKI_a_ATnDsFhb0dhyn8Z4Jq6o7aHRNQgW412tKbwJQ/fjQOiAiADFz1rYPF_IFGv6v5p7c\"",
      "primaryEmail": "admin@pvp-test-domain2.com",
      "name": {
        "givenName": "admin",
        "familyName": "admin",
        "fullName": "admin admin"
      },
      "isAdmin": true,
      "isDelegatedAdmin": false,
      "lastLoginTime": "2024-07-04T04:58:34.000Z",
      "creationTime": "2024-06-26T02:26:48.000Z",
      "agreedToTerms": true,
      "suspended": false,
      "archived": false,
      "changePasswordAtNextLogin": false,
      "ipWhitelisted": false,
      "emails": [
        {
          "address": "admin@pvp-test-domain2.com",
          "primary": true
        },
        {
          "address": "admin@pvp-test-domain2.com.test-google-a.com"
        }
      ],
      "languages": [
        {
          "languageCode": "ja",
          "preference": "preferred"
        }
      ],
      "nonEditableAliases": [
        "admin@pvp-test-domain2.com.test-google-a.com"
      ],
      "customerId": "C01i1u61m",
      "orgUnitPath": "/",
      "isMailboxSetup": true,
      "isEnrolledIn2Sv": false,
      "isEnforcedIn2Sv": false,
      "includeInGlobalAddressList": true
    },
    {
      "kind": "admin#directory#user",
      "id": "106252157683015712428",
      "etag": "\"nKI_a_ATnDsFhb0dhyn8Z4Jq6o7aHRNQgW412tKbwJQ/Te7lunSloW8ngKzeAkBIwu5Y8_k\"",
      "primaryEmail": "testadmin@pvp-test-domain2.com",
      "name": {
        "givenName": "Admin",
        "familyName": "Test-12",
        "fullName": "Admin Test-12"
      },
      "isAdmin": true,
      "isDelegatedAdmin": false,
      "lastLoginTime": "2024-09-04T07:54:07.000Z",
      "creationTime": "2024-07-04T05:01:51.000Z",
      "agreedToTerms": true,
      "suspended": false,
      "archived": false,
      "changePasswordAtNextLogin": false,
      "ipWhitelisted": false,
      "emails": [
        {
          "address": "testadmin@pvp-test-domain2.com",
          "primary": true
        },
        {
          "address": "testadmin@pvp-test-domain2.com.test-google-a.com"
        }
      ],
      "languages": [
        {
          "languageCode": "en",
          "preference": "preferred"
        }
      ],
      "nonEditableAliases": [
        "testadmin@pvp-test-domain2.com.test-google-a.com"
      ],
      "customerId": "C01i1u61m",
      "orgUnitPath": "/",
      "isMailboxSetup": true,
      "isEnrolledIn2Sv": false,
      "isEnforcedIn2Sv": false,
      "includeInGlobalAddressList": true
    },
    {
      "kind": "admin#directory#user",
      "id": "101801299353632366996",
      "etag": "\"nKI_a_ATnDsFhb0dhyn8Z4Jq6o7aHRNQgW412tKbwJQ/HvHMJ0yvfgXC6NUNj5WHjz6o1Es\"",
      "primaryEmail": "user1@pvp-test-domain2.com",
      "name": {
        "givenName": "User1",
        "familyName": "Test-12",
        "fullName": "User1 Test-12"
      },
      "isAdmin": false,
      "isDelegatedAdmin": false,
      "lastLoginTime": "2024-07-04T05:08:30.000Z",
      "creationTime": "2024-07-04T05:04:39.000Z",
      "agreedToTerms": true,
      "suspended": false,
      "archived": false,
      "changePasswordAtNextLogin": false,
      "ipWhitelisted": false,
      "emails": [
        {
          "address": "user1@pvp-test-domain2.com",
          "primary": true
        },
        {
          "address": "user1@pvp-test-domain2.com.test-google-a.com"
        }
      ],
      "languages": [
        {
          "languageCode": "en",
          "preference": "preferred"
        },
        {
          "languageCode": "ja",
          "preference": "preferred"
        }
      ],
      "nonEditableAliases": [
        "user1@pvp-test-domain2.com.test-google-a.com"
      ],
      "customerId": "C01i1u61m",
      "orgUnitPath": "/Org A",
      "isMailboxSetup": true,
      "isEnrolledIn2Sv": false,
      "isEnforcedIn2Sv": false,
      "includeInGlobalAddressList": true
    }
  ],
};
