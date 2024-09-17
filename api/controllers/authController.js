
const express = require('express');
const oauth2Client = require('../models/googleAuth'); // Google OAuth2 client setup
const config = require('../config/config'); // Configuration settings
const { google } = require('googleapis'); // Google APIs client library
const User = require('../models/User'); // User model for database operations
const router = express.Router();
const axios = require('axios'); // Import axios

// Retrieve the API base URL from environment variables
const API_BASE_URL = process.env.API_BASE_URL;


/**
 * Handle OAuth2 callback to process authentication and create a project.
 * @param {Object} req - The request object containing query parameters and session.
 * @param {Object} res - The response object used to send responses to the client.
 */
exports.oauth2callback = async (req, res) => {
  // Extract the authorization code and state from the query parameters
  const code = req.query.code;
  const { email, projectName } = JSON.parse(req.query.state);

  // Exchange the authorization code for tokens
  const { tokens } = await oauth2Client.getToken({ code, redirect_uri: config.REDIRECT_URI });
  // Store tokens in the session
    req.session.tokens = tokens;
  // Store email in the session
    req.session.email = email;
  // Store project name in the session
    req.session.projectName = projectName;

  // Log  for debugging 
    console.log('email', email);
    console.log('project name', projectName);
    console.log('tokens ', tokens["refresh_token"]);
    // If a refresh token is present, store it in the database
    if (tokens.refresh_token) {
      console.log('Storing refresh token');
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        console.log('Existing user: ', existingUser);
        // Update the existing user's tokens
        existingUser.tokens = tokens.refresh_token;
        // Save changes to the database
        await existingUser.save(); 
      } else {
        // If the user does not exist, create a new user with the provided details
        await User.create({ email, projectName, refreshToken: tokens.refresh_token });
      }
    }

    // Use axios instead of fetch to make the POST request
    const createProjectResponse = await axios.post(
      `${API_BASE_URL}/project/create-project`,
      {
        tokens,
        email,
        projectName,
      },
      {
        withCredentials: true, // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    res.status(200).json(createProjectResponse.data);

    // Dynamically import the 'node-fetch' module for making HTTP requests
    // const fetch = await import('node-fetch').then(mod => mod.default);
    // // Make a POST request to the create-project endpoint with tokens and user details
    // const createProjectResponse = await fetch(`${API_BASE_URL}/project/create-project`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     tokens,
    //     email,
    //     projectName
    //   }),
    //   credentials: 'include' // Include session cookies
    // });
    // // Parse the response data
    // const createProjectData = await createProjectResponse.json();
    // // Check if the response indicates success; throw an error if not
    // if (!createProjectResponse.ok) {
    //   throw new Error(createProjectData.message);
    // }

    // // Send the create project data as the response
    // res.status(200).json(createProjectData);

   
};

exports.logout = async (req, res) => {
  try {
    const token = oauth2Client.credentials.access_token;

    if (token) {
      // Revoke the token
      await oauth2Client.revokeToken(token);
      console.log('Token revoked successfully');
    }

    // Clear the session or cookies
    req.session = null; // If using express-session
    res.clearCookie('connect.sid'); // Adjust based on your cookie/session setup

    // Send a success response
    res.status(200).send({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).send({ message: 'Failed to logout' });
  }
};

