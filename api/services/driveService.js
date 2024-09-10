const { getCredentials, initializeGoogleAuth, impersonateClient } = require('../config/googleDriveConfig');
const { extractEmails } = require('../utility/utility_functions');
const config = require('../config/config');

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
const fetchPersonalDriveFiles = async () => {
  try {
    // Extract emails from the response
    const emailList = extractEmails(config.USERS_LIST_DIRECTORY);
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

module.exports = {
  fetchAllSharedDrives,
  fetchPersonalDriveFiles,
};