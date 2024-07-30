const { google } = require('googleapis');
const { ProjectsClient } = require('@google-cloud/resource-manager').v3;

const listOrganizations = async (authClient) => {
  // console.log(authClient);
  const cloudResourceManager = google.cloudresourcemanager('v3');
  try {
      const response = await cloudResourceManager.organizations.search({
          auth: authClient
      });
      // console.log(response.data.organizations);
      return response.data.organizations;
  } catch (error) {
      console.error('Error listing organizations:', error.response?.data || error.message);
      throw error;
  }
};

const createProject = async (oauth2Client, projectId, projectName, organizationId) => {
  const cloudResourceManager = google.cloudresourcemanager('v3');
  // const resourcemanagerClient = new ProjectsClient();
  const request = {
      requestBody: {
          projectId: projectId,
          displayName: projectName
      },
      auth: oauth2Client,
  };

  const response = await cloudResourceManager.projects.create(request);
  return response.data;
};

const listProjects = async (authClient, organizationId) => {
  const cloudResourceManager = google.cloudresourcemanager('v3');
  try {
      const response = await cloudResourceManager.projects.search({
          auth: authClient
      });
      return response.data.projects;
  } catch (error) {
      console.error('Error listing projects:', error.response?.data || error.message);
      throw error;
  }
};

const enableAPI = async (authClient, projectId, apiName) => {
  const serviceUsage = google.serviceusage({ version: "v1", auth: authClient });
  const request = {
    name: `projects/${projectId}/services/${apiName}`,
  };
  const response = await serviceUsage.services.enable(request);
  return response.data;
};

const createServiceAccount = async (authClient, projectId, accountId, displayName) => {
  const iam = google.iam("v1");
  if (accountId.length < 6) {
    accountId = accountId.padEnd(6, "0");
  } else if (accountId.length > 30) {
    accountId = accountId.substring(0, 30);
  }

  const request = {
    name: `projects/${projectId}`,
    resource: {
      accountId: accountId,
      serviceAccount: {
        displayName: displayName,
      },
    },
    auth: authClient,
  };
  const response = await iam.projects.serviceAccounts.create(request);
  return response.data;
};

const createServiceAccountKey = async (authClient, projectId, serviceAccountEmail) => {
  const iam = google.iam("v1");
  const request = {
    name: `projects/${projectId}/serviceAccounts/${serviceAccountEmail}`,
    auth: authClient,
    resource: {},
  };
  const response = await iam.projects.serviceAccounts.keys.create(request);
  return response.data;
};

const getServiceAccount = async (authClient, projectId, serviceAccountEmail) => {
  const service = google.iam('v1');
  const res = await service.projects.serviceAccounts.get({
    name: `projects/${projectId}/serviceAccounts/${serviceAccountEmail}`,
    auth: authClient
  });
  return res.data;
};

const listServiceAccounts = async (authClient, projectId) => {
  const service = google.iam('v1');
  const res = await service.projects.serviceAccounts.list({
    name: `projects/${projectId}`,
    auth: authClient
  });
  console.log('Service accounts:', res.data.accounts);
  // return res.data.accounts || [];
  return res.data.accounts;
};

module.exports = {
  listOrganizations,
  createProject,
  listProjects,
  enableAPI,
  createServiceAccount,
  createServiceAccountKey,
  getServiceAccount,
  listServiceAccounts
};
