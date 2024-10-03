const { printHierarchy, findItem } = require('../utility/utilityFunctions');
const oauth2Client = require('../models/googleAuth');
const { google } = require('googleapis'); // Google APIs client library
const ServiceAccountKeys = require('../models/ServiceAccountKeys');
const crypto = require('crypto');
const dataController = require('../controllers/dataController');
const { fetchPersonalDriveFiles, fetchAllSharedDrives, fetchFilesDetailsData, fetchAllSharedDrivesWithStorage,} = require('../services/driveService');
const encryptionKey = 'my-hardcoded-secret-key'; 
const config = require('../config/config');

// Function to decrypt the private key
function decodePrivateKeyData(privateKeyData) {
  const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8');
  return JSON.parse(decodedData);
}

// exports.listFiles = async (req, res) => {

//   try {
//     const drive = google.drive({ version: 'v3', auth: oauth2Client });
//     const response = await drive.files.list({
//       pageSize: 10,
//       fields: 'files(id, name, mimeType)',
//     });
//     res.status(200).json(response.data.files);
//   } catch (error) {
//     console.error('Error listing files:', error);
//     res.status(500).json({ message: 'Error listing files' });
//   }
// };

// //Older Function to get settings of a specific file by file ID
// exports.getFileSettings = async (req, res) => {
//   const { fileId } = req.params;

//   try {
//     const drive = google.drive({ version: 'v3', auth: oauth2Client });
//     const response = await drive.files.get({
//       fileId: fileId,
//       fields: 'id, name, mimeType, permissions, owners',
//     });
//     res.status(200).json(response.data);
//   } catch (error) {
//     console.error('Error fetching file settings:', error);
//     res.status(500).json({ message: 'Error fetching file settings' });
//   }
// };

// Older Function to get settings of a specific file by file ID
// exports.getFileSettingsById = async (req, res) => {
//   const { fileId } = req.params; // Get fileId from the URL parameters

//   if (!fileId) {
//       return res.status(400).json({ message: 'File ID is required' });
//   }

//   try {
//       const drive = google.drive({ version: 'v3', auth: oauth2Client });
//       const response = await drive.files.get({
//         fileId: fileId,
//         fields: '*', 
//         // fields: 'id, name, mimeType, permissions, owners, webViewLink, webContentLink, createdTime, modifiedTime, size, version, shared, sharingUser, viewersCanCopyContent, writersCanShare, copyRequiresWriterPermission, hasThumbnail, thumbnailLink', // Add all necessary fields here
//         //getting all fields
//     //     fields: `
//     //     id, 
//     //     name, 
//     //     mimeType, 
//     //     permissions, 
//     //     owners, 
//     //     shared, 
//     //     sharingUser, 
//     //     webViewLink, 
//     //     webContentLink, 
//     //     createdTime, 
//     //     modifiedTime, 
//     //     viewersCanCopyContent, 
//     //     writersCanShare, 
//     //     copyRequiresWriterPermission, 
//     //     hasThumbnail
//     // `.replace(/\s+/g, ''),
//     });
    

//       res.status(200).json(response.data);
//   } catch (error) {
//       console.error('Error fetching file settings:', error);
//       res.status(500).json({ message: 'Error fetching file settings' });
//   }
// };

// //Older Function to list all Personal Drive files
// exports.listDriveFiles = async (req, res) => {
//   try {
   
//     // let serviceAccountEmail = 'testadmin-pvp-test12-work@project-1724985033144.iam.gserviceaccount.com'; 
//     let serviceAccountEmail;
//     // const userEmail = 'testadmin@pvp-test-domain2.com';
//     const { userEmail } = req.body;
//     console.log(`UserEmail: ${userEmail}`);

//     let projectData = await dataController.getProjectData(userEmail);
//     let projectId = projectData.projectId;
//     console.log(`ProjectID: ${projectId}`);

//     let serviceAccountData = await dataController.getServiceAccountData(projectId);
//     // console.log(`Service Account email: ${serviceAccountData.serviceAccountEmail}`);

//     serviceAccountEmail = serviceAccountData.serviceAccountEmail;

//     // Retrieve the service account key details from the database
//     // let serviceAccountKey = await ServiceAccountKeys.findOne({
//     //   where: { serviceAccountEmail: serviceAccountEmail }
//     // });

//     let serviceAccountKey;

//     serviceAccountKey = await dataController.getServiceAccountKey(serviceAccountEmail);

//     if (!serviceAccountKey) {
//       return res.status(404).json({ message: 'Service account key not found' });
//     }

//     // Extract the private key data
//     // const privateKey = serviceAccountKey.privateKeyData;
//     // console.log(privateKey);
//     const keyData = decodePrivateKeyData(serviceAccountKey.privateKeyData);
//     console.log(keyData);
//     const privateKey = keyData.private_key;

//     // Create a new JWT client, specifying the user to impersonate
//     const jwtClient = new google.auth.JWT({
//       email: serviceAccountEmail,
//       key: privateKey,
//       scopes: ['https://www.googleapis.com/auth/drive'],
//       subject: userEmail // Impersonating this user
//     });

//     // Authorize the client
//     await jwtClient.authorize();

//     // Create a Drive API client
//     const drive = google.drive({ version: 'v3', auth: jwtClient });

//     // List the files in the user's drive
//     const response = await drive.files.list({
//       // pageSize: 10,
//       // fields: 'files(id, name, mimeType)',
//     });

//     // Send the list of files as the response
//     res.status(200).json(response.data.files);
//   } catch (error) {
//     console.error('Error listing files:', error);
//     res.status(500).json({ message: 'Error listing files' });
//   }
// };

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


    // const privateKey = decodePrivateKeyData(serviceAccountPrivateKey).private_key;

    //We need to send the ServiceAccountKey here, from the request body, and if it is not found, then fetch from the db
    const fileData = await fetchFilesDetailsData(emailToImpersonate, fileId,  serviceAccountEmail);
    
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
  console.log(serviceAccountEmail);
  try {

    const sharedDrivesWithFiles = await fetchAllSharedDrives(userEmail, serviceAccountEmail);

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

  console.log(`service accc: ${serviceAccountEmail}`);

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
  const {userEmail, serviceAccountEmail} = req.body;

  try{
    // Fetch all shared drives with their storage usage breakdown
    const sharedDrivesWithFiles = await fetchAllSharedDrivesWithStorage(userEmail, serviceAccountEmail);
    
    // Respond with a JSON containing shared drive storage breakdown, including the hierarchy of files/folders
     res.status(200).json({
      message: "Shared Drive Storage Breakdown",
      drives: sharedDrivesWithFiles.map(drive => ({
        driveName: drive.driveName,
        totalFiles: drive.totalFiles, // Total number of files in the shared drive
        totalStorage: drive.totalStorage,
        // details: drive.details, // Include the detailed info for each drive,
        // fileDetails: drive.fileDetails,  // Include the detailed info for each drive, including file details
        // folderDetails: drive.folderDetails,
        children: drive.children,
      }))
    });
  } catch(error){
    res.status(500).json({ error: error.message });  

  }
}
