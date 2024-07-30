const oauth2Client = require('../models/googleAuth');
const config = require('../config/config');
const { google } = require('googleapis');
const { query } = require('express');
const url = require('url');


const getAuthUrl = (email, projectName) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    // prompt: 'consent',
    scope: config.SCOPES,
    state: JSON.stringify({ email, projectName }),
    redirect_uri: config.REDIRECT_URI
  });
};

exports.register = (req, res) => {
  const { email, projectName } = req.body;

  if (!email || !projectName) {
    return res.status(400).send('Email and project name are required');
  } 

  const authUrl = getAuthUrl(email, projectName);

  res.status(200).json({ authUrl });
};

exports.oauth2callback = async (req, res) => {
  const code = req.query.code;
  const { email, projectName } = JSON.parse(req.query.state);

  const { tokens } = await oauth2Client.getToken({ code, redirect_uri: config.REDIRECT_URI });
    req.session.tokens = tokens;

    req.session.email = email;
    req.session.projectName = projectName;

    console.log('email', email);
    console.log('project name', projectName);

    const fetch = await import('node-fetch').then(mod => mod.default);

    const createProjectResponse = await fetch('http://localhost:4000/project/create-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokens,
        email,
        projectName
      }),
      credentials: 'include' // Include session cookies
    });

    const createProjectData = await createProjectResponse.json();
    if (!createProjectResponse.ok) {
      throw new Error(createProjectData.message);
    }

    // Respond to the client with the create project data
    res.status(200).json(createProjectData);

    // req.session.projectName = projectName;
    // res.redirect(`http://localhost:4000/create-project`);
    // res.redirect(url.format({pathname: "http://localhost:3000/project",
    //   query: {
    //     // tokens: JSON.stringify(tokens),
    //     email: email,
    //     projectName: projectName
    //   }
    // }));

    // res.redirect(`http://localhost:4000/create-project?tokens=${encodeURIComponent(JSON.stringify(tokens))}&email=${encodeURIComponent(email)}&projectName=${encodeURIComponent(projectName)}`);

    // res.send(`Tokens received. You can now use the API. Tokens: ${JSON.stringify(tokens)}`);

  // try {
  //   const { tokens } = await oauth2Client.getToken({ code, redirect_uri: config.REDIRECT_URI });
  //   req.session.tokens = tokens;

  //   req.session.email = email;
  //   req.session.projectName = projectName;
  //   // res.redirect(`http://localhost:4000/create-project`);
  //   res.redirect(url.format({pathname: "http://localhost:4000/create-project",
  //     query: {
  //       "tokens": tokens
  //     }
  //   }))

  //   // res.redirect(`http://localhost:4000/create-project?tokens=${encodeURIComponent(JSON.stringify(tokens))}&email=${encodeURIComponent(email)}&projectName=${encodeURIComponent(projectName)}`);

  //   res.send(`Tokens received. You can now use the API. Tokens: ${JSON.stringify(tokens)}`);
  // } catch (error) {
  //   res.status(500).send('Authentication failed');
  // }
};
