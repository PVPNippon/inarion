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
  DOMAIN_TEST:"pvp-test-domain2.com"
 
};