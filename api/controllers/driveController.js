const { printHierarchy, findItem } = require('../utility/utilityFunctions');
const oauth2Client = require('../models/googleAuth');
const { google } = require('googleapis'); // Google APIs client library
const ServiceAccountKeys = require('../models/ServiceAccountKeys');
const crypto = require('crypto');
const dataController = require('../controllers/dataController');
const { fetchPersonalDriveFiles, fetchAllSharedDrives, fetchFilesDetailsData, fetchAllSharedDrivesWithStorage, getGoogleServices,} = require('../services/driveService');
const encryptionKey = 'my-hardcoded-secret-key'; 
const config = require('../config/config');
const { getCredentials, initializeGoogleAuth, impersonateClient,impersonateClient2 } = require('../config/googleDriveConfig');
const {authenticate} = require('@google-cloud/local-auth');


/**
 * Controller function to handle the request for fetching a particular file data based on the fileId.
 *
 * This function is triggered when the client sends a request to retrieve the file data of a single file in a user's personal drive along with their metadata.
 * It calls the `fetchFilesDetailsData` service function to get the files and their metadata, then returns the result as a JSON response.
 *
 * @returns {Promise<void>} - Sends a JSON response with the personal drive files and their metadata or an error message.
 */

exports.getFileDetails = async (req, res) => {
  try {
    const { email, emailToImpersonate, projectId, serviceAccountEmail, serviceAccountPrivateKey } = req.body;
    const { fileId } = req.params;
    const userEmail = email;
    if (!userEmail || !fileId) {
      return res.status(400).json({ message: 'User email and file ID are required' });
    }

    console.log(`Fetching file details for user: ${userEmail} and file: ${fileId}`);

    //We need to send the ServiceAccountKey here, from the request body, and if it is not found, then fetch from the db
    const fileData = await fetchFilesDetailsData(emailToImpersonate, fileId,  serviceAccountEmail, serviceAccountPrivateKey);
    
    res.status(200).json(fileData);

  } catch (error) {
    console.error('Error fetching file details:', error);
    res.status(500).json({ message: 'Error fetching file details' });
  }
}; 


/**
 * Controller function to handle the request for fetching all shared drives and their file metadata.
 *
 * This function is triggered when the client sends a request to retrieve the list of shared drives along with their files' metadata.
 * It calls the `fetchAllSharedDrives` service function to get the shared drives and their file metadata, then returns the result as a JSON response.
 *
 * @returns {Promise<void>} - Sends a JSON response with the shared drives and their file metadata or an error message.
 */
exports.getSharedDrives = async (req, res) => {
  const {userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey} = req.body;
  try {

    const sharedDrivesWithFiles = await fetchAllSharedDrives(userEmail, serviceAccountEmail, serviceAccountPrivateKey);

    // Loop through each drive's hierarchy and print it
    sharedDrivesWithFiles.forEach(drive => {
      console.log(`Drive: ${drive.driveName}`);
      printHierarchy(drive.children);
      console.log('----------------------------------------------------')
    });


    res.status(200).json(sharedDrivesWithFiles);
  } catch (error) {
    console.error('Internal server error:', error);
    res.status(500).json({ error: 'Internal server error' });  
  }
};

/**
 * Controller function to handle the request for fetching personal drive files and their metadata.
 *
 * This function is triggered when the client sends a request to retrieve the files in a user's personal drive along with their metadata.
 * It calls the `fetchPersonalDriveFiles` service function to get the files and their metadata, then returns the result as a JSON response.
 *
 * @returns {Promise<void>} - Sends a JSON response with the personal drive files and their metadata or an error message.
 */
exports.getPersonalDriveFiles = async (req, res) => {

  const {userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey} = req.body;
  try {
    const personalDriveFiles = await fetchPersonalDriveFiles(userEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey); 

    // Loop through each drive's hierarchy and print it
    personalDriveFiles.forEach(drive => {
      console.log(`User: ${drive.email}`);
      console.log(`Drive: ${drive.driveName}`);
      printHierarchy(drive.children);
      console.log('----------------------------------------------------')
    });


    res.status(200).json(personalDriveFiles);
  } catch (error) {
    console.error('Internal server error:', error);
    res.status(500).json({ error: 'Internal server error' });  
  }
};





/**
 * Controller function to handle the request for fetching all shared drives with their storage usage breakdown.
 *
 * This function is triggered when the client sends a request to retrieve the storage usage breakdown of all shared drives 
 * a user has access to, including file and folder hierarchies, total file count, and storage size.
 * It calls the `fetchAllSharedDrivesWithStorage` service function to get the shared drives and their metadata, 
 * then returns the result as a JSON response.
 *
 * @param {Object} req - The request object, containing the `userEmail` and `serviceAccountEmail` in the body.
 * @param {Object} res - The response object used to send the JSON data or error message.
 * @returns {Promise<void>} - Sends a JSON response with the shared drives, file/folder details, total storage usage, 
 *                            or an error message in case of failure.
 */
exports.getAllSharedDrivesWithStorage = async (req, res) => {
  const {userEmail, serviceAccountEmail, serviceAccountPrivateKey} = req.body;

  try{
    // Fetch all shared drives with their storage usage breakdown
    const sharedDrivesWithFiles = await fetchAllSharedDrivesWithStorage(userEmail, serviceAccountEmail, serviceAccountPrivateKey);

    // Respond with a JSON containing shared drive storage breakdown, including the hierarchy of files/folders
     res.status(200).json({
      message: "Shared Drive Storage Breakdown",
      drives: sharedDrivesWithFiles.map(drive => ({
        driveName: drive.driveName,
        totalFiles: drive.totalFiles, // Total number of files in the shared drive
        totalStorage: drive.totalStorage,
        // details: drive.details, // Include the detailed info for each drive,
        fileDetails: drive.fileDetails,  // Include the detailed info for each drive, including file details
        // folderDetails: drive.folderDetails,
        children: drive.children,
      }))
    });
  } catch(error){
    res.status(500).json({ error: error.message });  

  }
}

/**
 * Controller function to handle the request for fetching Google Drive activity for a specific file or folder.
 *
 * This function is triggered when the client sends a request to retrieve activity details (e.g., edits, downloads, etc.)
 * for a specified item in Google Drive. It uses service account credentials and impersonates the specified user to
 * perform the activity query. The function allows filtering the activity details by a specific action (like edits).
 *
 * @param {Object} req - The request object containing `userEmail` and `serviceAccountEmail` in the body.
 *                       - `userEmail`: The email of the user to impersonate.
 *                       - `serviceAccountEmail`: The email of the service account used for authentication.
 * @param {Object} res - The response object used to send the JSON data or error message.
 * @returns {Promise<void>} - Sends a JSON response with the Google Drive activity or an error message if the query fails.
 */
exports.getDriveActivity = async (req, res) =>{

  // Extract userEmail and serviceAccountEmail and serviceAccountPrivateKey from the request body
  const { userEmail , serviceAccountEmail, serviceAccountPrivateKey} = req.body;

  // Retrieve the service account credentials using the provided key
  const credentials = await getCredentials(serviceAccountEmail, serviceAccountPrivateKey);


    // Initialize the Google Auth client using the retrieved credentials.
    const auth = await initializeGoogleAuth(credentials);
    const service = await impersonateClient2(userEmail, auth)  ;
    // const service = google.driveactivity({version: 'v2', auth: auth});
    const params = {
      // ancestorName: 'items/root', 
      // ancestorName: 'items/0AOv92gz8GfyoUk9PVA',
      itemName: 'items/1xrTRRskpwSGRCFy6N6JRpzqjwMDx0I1TV1OSwpXgF8o',
      // filter: 'detail.action_detail_case:DOWNLOAD',
      filter: 'detail.action_detail_case:EDIT',

      pageSize: 100, // Set the maximum number of activities to retrieve
    };  
    
  
    const result = await service.activity.query({requestBody: params});
    res.status(200).json({ result: result});

}