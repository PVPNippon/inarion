const { google } = require('googleapis');
const config = require('../config/config');

const oauth2Client = new google.auth.OAuth2(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.REDIRECT_URI
);

module.exports = oauth2Client;
