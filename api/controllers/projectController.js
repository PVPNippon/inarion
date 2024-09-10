const googleService = require('../services/googleService'); // Import Google service functions
const oauth2Client = require('../models/googleAuth'); // Import OAuth2 client for authentication
const Project = require('../models/Project'); // Import Project model
const url = require('url'); // Import URL module
const User = require('../models/User'); // Import User model
const ServiceAccount = require('../models/ServiceAccount'); // Import ServiceAccount model
const ServiceAccountKeys = require('../models/ServiceAccountKeys'); // Import ServiceAccountKeys model

// Utility function to retry an async function on failure
async function retryAsync(fn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Retry ${i + 1}/${retries} failed: ${error.message}. Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
      } else {
        throw new Error(`Failed after ${retries} retries: ${error.message}`); // Throw error after all retries fail
      }
    }
  }
}

// Find a user by their email address
const findUserByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('User not found'); // Error if user is not found
  }
  return user;
};

// Get the organization ID from Google Cloud
const getOrganizationId = async () => {
  const organizations = await googleService.listOrganizations(oauth2Client);
  if (!organizations || organizations.length === 0) {
    throw new Error('No organizations found'); // Error if no organizations are found
  }
  return organizations[0].name.split('/')[1]; // Return the organization ID
};

// Get or create a project in Google Cloud
const getOrCreateProject = async (projectName, organizationId, userId) => {
  const projects = await googleService.listProjects(oauth2Client, organizationId);
  const existingProject = projects.find(project => project.displayName.trim() === projectName.trim());
  let projectId, project;

  if (existingProject) {
    projectId = existingProject.projectId;
    project = await Project.findOrCreate({
      where: { projectName, userId },
      defaults: { projectId, organizationId }
    });
  } else {
    projectId = `project-${Date.now()}`; // Generate a unique project ID
    const createdProject = await googleService.createProject(oauth2Client, projectId, projectName, organizationId);
    project = await Project.create({
      projectName,
      userId,
      projectId,
      organizationId
    });
  }

  return { project, projectId }; // Return the project and its ID
};

// Route to create a new project
exports.createProject = async (req, res) => {
  console.log('Entered the create project route');
  const { tokens, email, projectName } = req.body;

  // Logging the tokens and other parameters for debugging
  console.log('Tokens used to create project:', tokens);
  console.log('Email:', email);
  console.log('Project Name:', projectName);
  try {
    // Set OAuth2 credentials for the Google service
    googleService.setOauth2Credentials(tokens);

    // Find the user by email
    const user = await findUserByEmail(email);
    const userId = user.id;
    console.log('userId ', userId);

    // Get the organization ID
    const organizationId = await getOrganizationId();

    // Get or create the project
    const { project, projectId } = await getOrCreateProject(projectName, organizationId, userId);

    // Retry enabling APIs for the project
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, "serviceusage.googleapis.com"));
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, "admin.googleapis.com"));
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, "drive.googleapis.com"));
    
    //Check for existing service account in the Database
    const serviceAccountName = email.replace(/[@.]/g, "-");
    var serviceAccounts = await googleService.listServiceAccounts(oauth2Client, projectId);
    if(serviceAccounts === undefined)
      serviceAccounts = [];
    console.log('List of Service accounts: ', serviceAccounts);

    // Checking if service account exists in customer's project
    let serviceAccount = serviceAccounts.find(account => account.displayName === `${email}'s Service Account`);

    // Check if the service account already exists in the database
    let existingServiceAccountInDB = await ServiceAccount.findOne({ where: { projectId: projectId } });

    if (!existingServiceAccountInDB && !serviceAccount) {
      console.log('Creating service account in Google Cloud and storing it in the database...');
      serviceAccount = await googleService.createServiceAccount(oauth2Client, projectId, serviceAccountName, `${email}'s Service Account`);
      await ServiceAccount.create({
        projectId,
        serviceAccountEmail: serviceAccount.email
      });
    } else if (serviceAccount && !existingServiceAccountInDB) {
      console.log('Service account exists in Google Cloud but not in the database, storing it...');
      await ServiceAccount.create({
        projectId,
        serviceAccountEmail: serviceAccount.email
      });
    } else if (!serviceAccount && existingServiceAccountInDB) {
      console.log('Service account exists in the database but not in Google Cloud, creating it...');
      serviceAccount = await googleService.createServiceAccount(oauth2Client, projectId, serviceAccountName, `${email}'s Service Account`);
      await ServiceAccount.create({
        projectId,
        serviceAccountEmail: serviceAccount.email
      });
    }


        // Variables
    let serviceAccountDetails;  // Variable to hold service account details
    let serviceAccountKey;      // Variable to hold the generated service account key
    let serviceAccountEmail = serviceAccount.email;  // Retrieve the service account email from the provided object
    let clientServiceAccountId; // Variable to hold the client service account ID

    // Check if the service account key already exists in the database
    let serviceAccountKeyInDB = await ServiceAccountKeys.findOne({ where: { serviceAccountEmail: serviceAccountEmail } });

    console.log('Does Service Account exist in DB - ', serviceAccountKeyInDB);

    if (!serviceAccountKeyInDB) {
        console.log('Creating service account key in Google Cloud and storing it in the database...');
        
        // If no key exists in the DB, create a new service account key using Google Cloud API
        serviceAccountKey = await googleService.createServiceAccountKey(oauth2Client, projectId, serviceAccountEmail);
        console.log('Created key in GCloud: ', serviceAccountKey);

        const privateKeyData = serviceAccountKey.privateKeyData; // Extract the private key data from the created key
        const privateKeyId = serviceAccountKey.name.split('/').pop(); // Extract the private key ID from the key name

        // Decode the privateKeyData from base64 to utf8 format
        const decodedKey = Buffer.from(serviceAccountKey.privateKeyData, 'base64').toString('utf8');

        clientServiceAccountId = decodedKey.client_id; // Extract the client ID from the decoded key

        // Store the service account key details in the database
        serviceAccountKeyInDB = await ServiceAccountKeys.create({
            serviceAccountEmail: serviceAccountEmail,
            privateKeyId: privateKeyId,
            privateKeyData: privateKeyData,
            validAfterTime: new Date(serviceAccountKey.validAfterTime),
            validBeforeTime: new Date(serviceAccountKey.validBeforeTime)
        });

        console.log('Created key in DB ', serviceAccountKeyInDB);
    } else {
        console.log('Existing service account found in DB', serviceAccountKeyInDB);

        // Retrieve existing service account details using Google Cloud API
        serviceAccountDetails = await googleService.getServiceAccount(oauth2Client, projectId, serviceAccountEmail);
        clientServiceAccountId = serviceAccountDetails.oauth2ClientId; // Extract the OAuth2 client ID from the details

        serviceAccountKey = serviceAccountKeyInDB.privateKeyData;

        // Decode the privateKeyData from base64 to utf8 format
        const decodedKey = Buffer.from(serviceAccountKeyInDB.privateKeyData, 'base64').toString('utf8');
        console.log('Decoded key file data is:', decodedKey);
    }

    // Prepare full project data, including project ID, service account email, key, and client ID
    const fullCreateProjectData = {
        projectId,
        serviceAccountEmail,
        serviceAccountKey,
        clientServiceAccountId,
    };

    req.session.projectData = fullCreateProjectData; // Store the project data in the session

    const fetch = await import('node-fetch').then(mod => mod.default); // Dynamic import of node-fetch module

    // Respond with the full project data as a JSON object
    res.status(201).json({
        fullCreateProjectData
    });
  } catch (err) {
    // Handle errors
    res.status(500).send(`Error creating project: ${err.message}`);
  }
};

// Route to get project data from the session
exports.getProjectData = (req, res) => {
  if (req.session.projectData) {
    res.status(200).json(req.session.projectData);
  } else {
    res.status(404).json({ error: 'No project data found in session' });
  }
};

// Route to get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'An error occurred while fetching projects.' });
  }
};
