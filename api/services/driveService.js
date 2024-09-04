const { getCredentials, initializeGoogleAuth, impersonateClient } = require('../config/googleDriveConfig');

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
    const serviceAccountEmail = 'testadmin-pvp-test12-work@project-1724811051563.iam.gserviceaccount.com';

    // Fetch the service account credentials from the database and decode them.
    const credentials = await getCredentials(serviceAccountEmail);

    // Initialize the Google Auth client using the retrieved credentials.
    const auth = await initializeGoogleAuth(credentials);

    // Impersonate the specified user to access their Google Drive.
    return impersonateClient(user, auth);
  } catch (error) {
    // Log the error if there's an issue initializing the Google Drive instance.
    console.error('Error initializing Google Drive instance:', error.message);
    throw error; // Rethrow the error to be handled by the caller.
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
    const drive = await getDriveInstance('testadmin@pvp-test-domain2.com');
        
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
    const drive = await getDriveInstance('testadmin@pvp-test-domain2.com');

    // Fetch all files in the user's personal drive with metadata
    const filesResponse = await drive.files.list({
      fields: 'files(id, name, mimeType, modifiedTime, owners)',
    });

    return filesResponse.data.files || [];
  } catch (error) {
    console.error('Error fetching personal drive files and their metadata:', error.message);
    throw error;
  }
};

module.exports = {
  fetchAllSharedDrives,
  fetchPersonalDriveFiles,
};