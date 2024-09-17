// Function to decrypt the private key
const oauth2Client = require('../models/googleAuth');
const { google } = require('googleapis'); // Google APIs client library
const ServiceAccountKeys = require('../models/ServiceAccountKeys');
const crypto = require('crypto');
const dataController = require('../controllers/dataController');
const encryptionKey = 'my-hardcoded-secret-key'; 
const config = require('../config/config');
require('dotenv').config();


function decodePrivateKeyData(privateKeyData) {
    const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8');
    return JSON.parse(decodedData);
  }
  


  /**
 * Retrieves a list of users from the specified domain using Google Admin SDK.
 * 
 * This function interacts with the Google Admin Directory API to list all users within a specified domain.
 * It retrieves the service account data and key for the domain, uses JWT authentication to impersonate a user,
 * and makes the API request to list the domain users. The function requires the service account email, private key, 
 * and the email of the user to impersonate.
 * 
 * @param {Object} req - The request object containing the `email` and `userEmail` in the request body.
 * @param {Object} res - The response object used to return the list of users or an error.
 * @returns {Promise<void>} - Responds with the list of users in the domain or an error message.
 * @throws {Error} - Throws an error if the service account key is not found or if there is an issue with the API call.
 */
exports.getDomainUsersList = async (req, res) =>{
    const { email, userEmail } = req.body;  // Extract the email and userEmail from the request body
  console.log(`UserEmail: ${userEmail}`);

  // Retrieve project data using the user email
  let projectData = await dataController.getProjectData(userEmail);
  let projectId = projectData.projectId;
  console.log(`ProjectID: ${projectId}`);

  // Retrieve service account data using the project ID
  let serviceAccountData = await dataController.getServiceAccountData(projectId);
  let serviceAccountEmail = serviceAccountData.serviceAccountEmail;

  // Retrieve the service account key using the service account email
  let serviceAccountKey = await dataController.getServiceAccountKey(serviceAccountEmail);

  // If the service account key is not found, return a 404 error
  if (!serviceAccountKey) {
    return res.status(404).json({ message: 'Service account key not found' });
  }

    // Extract the private key data
    // const privateKey = serviceAccountKey.privateKeyData;
    // console.log(privateKey);

    
  // Decode the private key data for the service account
    const keyData = decodePrivateKeyData(serviceAccountKey.privateKeyData);
    console.log(keyData);
    const privateKey = keyData.private_key;

    // Create a new JWT client, specifying the user to impersonate
    const jwtClient = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
      subject: userEmail // Impersonating this user
    });

        // Authorize the client
    await jwtClient.authorize();

    const admin = google.admin({version: 'directory_v1',
        auth: jwtClient,
    });

    const response = await admin.users.list({
        // customer: 'my_customer', // Use 'my_customer' to list users in the entire domain
        // domain: 'pvp-test-domain2.com',
        domain: process.env.DOMAIN_TEST,
      });

    // Return the list of users as the response
    res.status(200).json(response.data.users);


  

}

//Old Function to get users list
async function getAllUsersList(userEmail) {
  try {
    console.log(`Fetching users for admin: ${userEmail}`);

    // Fetch project and service account details (similar to your current implementation)
    let projectData = await dataController.getProjectData(userEmail);
    let projectId = projectData.projectId;

    let serviceAccountData = await dataController.getServiceAccountData(projectId);
    let serviceAccountEmail = serviceAccountData.serviceAccountEmail;

    let serviceAccountKey = await dataController.getServiceAccountKey(serviceAccountEmail);
    if (!serviceAccountKey) {
      throw new Error('Service account key not found');
    }

    // Decode the private key data
    const keyData = decodePrivateKeyData(serviceAccountKey.privateKeyData);
    const privateKey = keyData.private_key;

    // Create JWT client for the service account
    const jwtClient = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
      subject: userEmail // Impersonating this user
    });

    // Authorize the client
    await jwtClient.authorize();

    const admin = google.admin({
      version: 'directory_v1',
      auth: jwtClient,
    });

    // Fetch the list of users in the domain
    const response = await admin.users.list({
      domain: 'pvp-test-domain2.com',
    });

    // Return the list of users
    return response.data.users;
  } catch (error) {
    console.error('Error fetching domain users:', error);
    throw error;
  }
}

//Old Function to get users files
async function getDriveFilesForAllUsers(userEmail) {
  try {
    // Step 1: Fetch the list of users in the domain
    const users = await getAllUsersList(userEmail);

    const results = [];

    // Step 2: For each user, fetch their Drive files
    for (const user of users) {
      const userDriveFiles = await getDriveFilesForUser(user.primaryEmail); // Assuming primaryEmail is the user's email
      results.push({
        userEmail: user.primaryEmail,
        files: userDriveFiles,
      });
    }

    // Step 3: Return the combined results
    return results;
  } catch (error) {
    console.error('Error fetching Drive files for all users:', error);
    throw error;
  }
}

exports.listAllDriveFiles = async (req, res) => {
  const { userEmail } = req.body; // The admin user's email for impersonation

  try {
    // Fetch all the Drive files for all users
    const allUserDriveFiles = await getDriveFilesForAllUsers(userEmail);

    // Return the result in the response
    res.status(200).json(allUserDriveFiles);
  } catch (error) {
    console.error('Error listing Drive files for all users:', error);
    res.status(500).json({ message: 'Error listing Drive files for users' });
  }
};
