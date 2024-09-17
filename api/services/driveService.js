const { getCredentials, initializeGoogleAuth, impersonateClient } = require('../config/googleDriveConfig');
const config = require('../config/config');
const { extractEmails } = require('../utility/utility_function');
const { default: axios } = require('axios');
const API_BASE_URL = process.env.API_BASE_URL;
const { google } = require('googleapis'); // Google APIs client library

/**
 * Initializes the Google Drive instance for a specified user.
 * 
 * This function sets up the Google Drive API client by impersonating a user within the client's domain.
 * It retrieves the credentials, initializes the Google Auth client, and then impersonates the given user.
 * 
 * @param {string} user - The email address of the user to impersonate.
 * @returns {Promise<Object>} - A promise that resolves to the Google Drive client instance.
 * @throws Will throw an error if there is an issue initializing the Google Drive instance.
 */
async function getDriveInstance(user) {
  try {
    //TODO(AlexMartinMason): The service account email is hard-coded here. This email is specific to the client's domain and is used to authenticate API requests.
    const serviceAccountEmail = config.CLIENT_SERVICE_ACCOUNT_EMAIL;

    // Fetch the service account credentials from the database and decode them.
    const credentials = await getCredentials(serviceAccountEmail);

    // Initialize the Google Auth client using the retrieved credentials.
    const auth = await initializeGoogleAuth(credentials);

    // Impersonate the specified user to access their Google Drive.
    return impersonateClient(user, auth);
  } catch (error) {
    // Log the error if there's an issue initializing the Google Drive instance.
    throw new Error(`Failed to initialize Google Drive for user ${user}: ${error.message}`);
  }
}

/**
 * Fetches all shared drives and their file metadata.
 * 
 * This function lists all shared drives and retrieves metadata for each file within those drives.
 * 
 * @returns {Promise<Array>} - A promise that resolves to an array of objects, each representing a shared drive and its files' metadata.
 * @throws Will throw an error if there is an issue fetching the shared drives or their files' metadata.
 */
const fetchAllSharedDrives = async () => {
  try {
    //TODO(AlexMartinMason): The super admin's email is hard-coded here. This email is specific to the client's domain and is used to authenticate API requests.
    const drive = await getDriveInstance(config.SUPER_ADMIN_EMAIL);
        
    // Fetch all shared drives
    const drivesResponse = await drive.drives.list();
    const sharedDrives = drivesResponse.data.drives || [];
    
    const sharedDrivesWithFiles = [];

    // For each shared drive, fetch the file metadata
    for (const sharedDrive of sharedDrives) { 
      const filesResponse = await drive.files.list({
        corpora: 'drive',
        driveId: sharedDrive.id,  
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'files(id, name, mimeType, modifiedTime, owners)',
      });
      sharedDrivesWithFiles.push({
        driveName: sharedDrive.name,
        files: filesResponse.data.files || [],
      });
    }

    return sharedDrivesWithFiles;
  } catch (error) {
    console.error('Error fetching shared drives and their file metadata:', error.message);
    throw error;
  }
};

/**
 * Fetches all files and their metadata from the personal drive of the impersonated user.
 * 
 * This function lists all files in the personal drive and retrieves their metadata.
 * 
 * @returns {Promise<Array>} - A promise that resolves to an array of files' metadata.
 * @throws Will throw an error if there is an issue fetching the files or their metadata.
 */
const fetchPersonalDriveFiles = async ( adminEmail) => {
  try {
    // Extract emails from the response
    // const emailList = extractEmails(config.USERS_LIST_DIRECTORY);
    // const adminEmail = "testadmin@pvp-test-domain2.com";
    let usersEmailsList = await axios.post(
      `${API_BASE_URL}/users/users-list`,
      {
        userEmail: adminEmail
      },
      {
        withCredentials: true, // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    // console.log(usersEmailsList);
    // const emailList = extractEmails(usersEmailsList);
    const emailList = usersEmailsList.data.map(user => user.primaryEmail);
    console.log(emailList);
    const personalDrivesWithFiles = [];

    for (const email of emailList) {
      try {
          let drive = await getDriveInstance(email);
          let filesResponse = await drive.files.list({
              fields: 'files(id, name, mimeType, modifiedTime, owners)',
          });
          personalDrivesWithFiles.push({
            email,
            files: filesResponse.data.files,
        });
      } catch (error) {
          console.error(`Failed to process email ${email}:`, error);
      }
  }

    return personalDrivesWithFiles;
  } catch (error) {
    console.error('Error fetching personal drive files and their metadata:', error.message);
    throw error;
  }
};


/**
 * Fetches metadata of a specific file from the Google Drive of an impersonated user.
 * 
 * This function impersonates a user using their email and a service account private key,
 * then retrieves the metadata of the specified file from their Google Drive. It leverages
 * Google's Drive API for file operations.
 * 
 * @param {string} emailToImpersonate - The email address of the user to impersonate in Google Drive.
 * @param {string} fileId - The ID of the file for which metadata is being fetched.
 * @param {string} privateKey - The private key for the service account used to authenticate the request.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the file's metadata.
 * @throws Will throw an error if there is an issue with impersonating the user or fetching the file metadata.
 */
async function fetchFilesDetailsData(emailToImpersonate, fileId, privateKey) {

  // Get the Google Drive instance using the impersonated user's email.
  let drive = await getDriveInstance(emailToImpersonate);


// Get the metadata of the file identified by the fileId from the user's Google Drive.
  // 'fields: *' retrieves all available fields for the file metadata.
  const fileData = await drive.files.get({
      fileId: fileId,
      fields: '*', // We can specify specific fields you want to retrieve, or '*' for all fields
    });

  // Return the file's metadata.
    return(fileData.data);
}

module.exports = {
  fetchAllSharedDrives,
  fetchPersonalDriveFiles,
  fetchFilesDetailsData,
};