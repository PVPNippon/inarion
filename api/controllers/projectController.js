const googleService = require('../services/googleService');
const oauth2Client = require('../models/googleAuth');
const Project = require('../models/Project');
const url = require('url');
const User = require('../models/User'); 
const ServiceAccount = require('../models/ServiceAccount')


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

const setOauth2Credentials = (tokens) => {
  if (!tokens || !tokens.access_token) {
    throw new Error('No access token provided');
  }
  oauth2Client.setCredentials(tokens);
};


exports.createProject = async (req, res) => {
  console.log('Entered the create project route');
  const { tokens, email, projectName } = req.body;

 // Logging the tokens to ensure they are being used
  console.log('Tokens used to create project:', tokens);
  console.log('Email:', email);
  console.log('Project Name:', projectName);
  try {
    if (!tokens || !tokens.access_token) {
      throw new Error('No access token provided');
    }
    oauth2Client.setCredentials(tokens);

    // setOauth2Credentials(tokens);

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const userId = user.id;
    console.log('userId ', userId);

    // Check if the project already exists in the database
    

    const organizations = await googleService.listOrganizations(oauth2Client);
    console.log(organizations);
    if (!organizations || organizations.length === 0) {
      return res.status(404).send('No organizations found');
    }
    // const organizationId = organizations[0].organizationId;
    // console.log(organizationId);

    const organizationId = organizations[0].name.split('/')[1];
    // console.log(organizationId);

    

    const projects = await googleService.listProjects(oauth2Client, organizationId);
    // console.log(projects);
    let projectId, createdProject;
    const existingProject = projects.find(project => {
      // console.log(`Checking project: ${project.displayName} against ${projectName}`);
      return project.displayName.trim() === projectName.trim();
    });
    console.log(existingProject);

    if (existingProject) {
      console.log('Existing project:', existingProject);
      projectId = existingProject.projectId;
      createdProject = existingProject;

      let project = await Project.findOne({ where: { projectName: projectName, userId: userId } });
      if (project) {
        console.log('Project already exists in the database:', project);
        // return res.status(200).json({ projectData: project });
      }
      else{
        project = await Project.create({
          projectName: projectName,
          userId: userId, 
          projectId: projectId,
          organizationId: organizationId
        });
  
        console.log('Stored existing project in GCloud in the database:', project);
      }
    } else {
      projectId = `project-${Date.now()}`;
      createdProject = await googleService.createProject(oauth2Client, projectId, projectName, organizationId);
      console.log('Created new project:', createdProject);

      let project = await Project.findOne({ where: { name: projectName, userId } });
      if (project) {
        console.log('Project already exists in the database:', project);
        // return res.status(200).json({ projectData: project });
      }
      else{
        project = await Project.create({
          projectName: projectName,
          userId: userId, 
          projectId: projectId,
          organizationId: organizationId
        });
  
        console.log('Stored new project in GCloud in the database:', project);
      }

    }

    // await googleService.enableAPI(oauth2Client, projectId, "serviceusage.googleapis.com");
    // await googleService.enableAPI(oauth2Client, projectId, "admin.googleapis.com");

    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, "serviceusage.googleapis.com"));
    await retryAsync(() => googleService.enableAPI(oauth2Client, projectId, "admin.googleapis.com"));


    var serviceAccounts = await googleService.listServiceAccounts(oauth2Client, projectId);
    if(serviceAccounts === undefined)
      serviceAccounts = [];
    console.log('List of Service accounts: ', serviceAccounts);
    const serviceAccountName = email.replace(/[@.]/g, "-");

    // Checking if service account exists in customer's project
    let serviceAccount = serviceAccounts.find(account => account.displayName === `${email}'s Service Account`);

    // Check if the service account already exists in the database
    let existingServiceAccountInDB = await ServiceAccount.findOne({ where: {  projectId: projectId } });

    if (existingServiceAccountInDB) {
      console.log('Service account already exists in the database:', existingServiceAccountInDB);

      if (!serviceAccount) {
        console.log('Service account does not exist in GCloud, creating it...');
        serviceAccount = await googleService.createServiceAccount(oauth2Client, projectId, serviceAccountName, `${email}'s Service Account`);
      }
    }
    else{
      if (serviceAccount) {
        console.log('Service account exists in GCloud but not in the database, storing it in the database...');
        await ServiceAccount.create({
          projectId: projectId,
          serviceAccountEmail: serviceAccount.email,
        });
      }
      else{
        console.log('Service account does not exist in GCloud and in the database, creating it...');
        serviceAccount = await googleService.createServiceAccount(oauth2Client, projectId, serviceAccountName, `${email}'s Service Account`);
        // const serviceAccountKey = await googleService.createServiceAccountKey(oauth2Client, projectId, serviceAccountEmail);
        // const serviceAccountDetails = await googleService.getServiceAccount(oauth2Client, projectId, serviceAccountEmail);
        await ServiceAccount.create({
          projectId: projectId,
          serviceAccountEmail: serviceAccount.email,
          // clientId: newServiceAccount.clientId,
          // privateKey: serviceAccountKey.privateKey,
        });
      }
    }


    // if (!serviceAccount) {
    //   serviceAccount = await googleService.createServiceAccount(oauth2Client, projectId, serviceAccountName, `${email}'s Service Account`);
    // }

    const serviceAccountEmail = serviceAccount.email;
    const serviceAccountKey = await googleService.createServiceAccountKey(oauth2Client, projectId, serviceAccountEmail);
    const serviceAccountDetails = await googleService.getServiceAccount(oauth2Client, projectId, serviceAccountEmail);
    const clientId = serviceAccountDetails.oauth2ClientId;

    const fullCreateProjectData = {
      projectId,
      serviceAccountEmail,
      serviceAccountKey,
      clientId,
    };

    req.session.projectData = fullCreateProjectData;


    // Redirect to the project details page with query parameters
    // const reactServerUrl = `http://localhost:5000/project-details`;
    const fetch = await import('node-fetch').then(mod => mod.default);

    // const response = await fetch(reactServerUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(fullCreateProjectData),
    // });

    // if (!response.ok) {
    //   throw new Error('Failed to send project details to React app');
    // }

    // Redirect to the project details page
    // res.redirect('http://localhost:5000/project-details');

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