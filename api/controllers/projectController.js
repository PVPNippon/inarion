const googleService = require('../services/googleService');
const oauth2Client = require('../models/googleAuth');
const Project = require('../models/Project');
const url = require('url');
const User = require('../models/User'); 
const ServiceAccount = require('../models/ServiceAccount');
const ServiceAccountKeys = require('../models/ServiceAccountKeys');


async function retryAsync(fn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Retry ${i + 1}/${retries} failed: ${error.message}. Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`Failed after ${retries} retries: ${error.message}`);
      }
    }
  }
}


const findUserByEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

const getOrganizationId = async () => {
  const organizations = await googleService.listOrganizations(oauth2Client);
  if (!organizations || organizations.length === 0) {
    throw new Error('No organizations found');
  }
  return organizations[0].name.split('/')[1];
};

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
    projectId = `project-${Date.now()}`;
    const createdProject = await googleService.createProject(oauth2Client, projectId, projectName, organizationId);
    project = await Project.create({
      projectName,
      userId,
      projectId,
      organizationId
    });
  }

  return { project, projectId };
};

exports.createProject = async (req, res) => {
  console.log('Entered the create project route');
  const { tokens, email, projectName } = req.body;

 // Logging the tokens to ensure they are being used
  console.log('Tokens used to create project:', tokens);
  console.log('Email:', email);
  console.log('Project Name:', projectName);
  try {
    
    // setOauth2Credentials(tokens);
    googleService.setOauth2Credentials(tokens);


    const user = await findUserByEmail(email);

   
    const userId = user.id;
    console.log('userId ', userId);

    const organizationId = await getOrganizationId();

    const { project, projectId } = await getOrCreateProject(projectName, organizationId, userId);


    
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, "serviceusage.googleapis.com"));
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, "admin.googleapis.com"));

    //Check for existing service account in the Database
    const serviceAccountName = email.replace(/[@.]/g, "-");

    var serviceAccounts = await googleService.listServiceAccounts(oauth2Client, projectId);
    if(serviceAccounts === undefined)
      serviceAccounts = [];
    console.log('List of Service accounts: ', serviceAccounts);
    // const serviceAccountName = email.replace(/[@.]/g, "-");

    // Checking if service account exists in customer's project
    let serviceAccount = serviceAccounts.find(account => account.displayName === `${email}'s Service Account`);

    // Check if the service account already exists in the database
    let existingServiceAccountInDB = await ServiceAccount.findOne({ where: {  projectId: projectId } });

   
    if (!existingServiceAccountInDB && !serviceAccount) {
      console.log('Creating service account in Google Cloud and storing it in the database...');
      serviceAccount = await googleService.createServiceAccount(oauth2Client, projectId, serviceAccountName, `${email}'s Service Account`);
      await ServiceAccount.create({
        projectId,
        serviceAccountEmail: serviceAccount.email
      });
    }
    else if (serviceAccount && !existingServiceAccountInDB) {
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


 


    
    // Check if service account keys already exist in the database
    let serviceAccountKeyInDB = await ServiceAccountKeys.findOne({ where: { serviceAccountEmail: serviceAccount.email } });
    let serviceAccountKey;
        // let serviceAccountKeyInDB = await ServiceAccountKeys.findAll();
    if (!serviceAccountKeyInDB) {
      console.log('Creating service account key in Google Cloud and storing it in the database...');
       serviceAccountKey = await googleService.createServiceAccountKey(oauth2Client, projectId, serviceAccount.email);
       console.log('Created key in GCloud: ', serviceAccountKey);
       const privateKeyId = serviceAccountKey.name.split('/').pop(); // Extracting the last part of the name as privateKeyId
      console.log('privateKeyId ', privateKeyId);
      serviceAccountKeyInDB = await ServiceAccountKeys.create({
        serviceAccountEmail: serviceAccount.email,
        // privateKeyId: serviceAccountKey.privateKeyId,
        privateKeyId: privateKeyId,

        privateKeyData: serviceAccountKey.privateKeyData,
        validAfterTime: new Date(serviceAccountKey.validAfterTime),
        validBeforeTime: new Date(serviceAccountKey.validBeforeTime)
      });

      console.log('Created key in DB ', serviceAccountKeyInDB);
    }

    console.log('existing service account ', serviceAccountKeyInDB);

    const serviceAccountEmail = serviceAccount.email;
    // serviceAccountKey = await googleService.createServiceAccountKey(oauth2Client, projectId, serviceAccountEmail);
    const serviceAccountDetails = await googleService.getServiceAccount(oauth2Client, projectId, serviceAccountEmail);
    const clientId = serviceAccountDetails.oauth2ClientId;

    const fullCreateProjectData = {
      projectId,
      serviceAccountEmail,
      serviceAccountKey,
      clientId,
    };

    req.session.projectData = fullCreateProjectData;

    const fetch = await import('node-fetch').then(mod => mod.default);

    
    res.status(201).json({
      fullCreateProjectData
    });
  } catch (err) {
    res.status(500).send(`Error creating project: ${err.message}`);
  }
};

exports.getProjectData = (req, res) => {
  if (req.session.projectData) {
    res.status(200).json(req.session.projectData);
  } else {
    res.status(404).json({ error: 'No project data found in session' });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'An error occurred while fetching projects.' });
  }
};