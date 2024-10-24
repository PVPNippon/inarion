// config/config.js
require('dotenv').config()

module.exports = {
  PERSONAL_DRIVE_NAME: process.env.PERSONAL_DRIVE_NAME,
  DOMAIN_TEST: process.env.DOMAIN_TEST,
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
  REDIRECT_URI: 'http://localhost:4000/project/initiate-project',
  SCOPES: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.domain',
    'https://www.googleapis.com/auth/activity',
    'https://www.googleapis.com/auth/drive.activity',
    'https://www.googleapis.com/auth/drive.activity.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',

  ],
}
