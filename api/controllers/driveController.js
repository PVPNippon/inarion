const oauth2Client = require('../models/googleAuth');
const { google } = require('googleapis'); // Google APIs client library
const ServiceAccountKeys = require('../models/ServiceAccountKeys');
const crypto = require('crypto');
const dataController = require('../controllers/dataController');
const encryptionKey = 'my-hardcoded-secret-key'; 

// Function to decrypt the private key
function decodePrivateKeyData(privateKeyData) {
  const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8');
  return JSON.parse(decodedData);
}


// Function to list Google Drive files
exports.listFiles = async (req, res) => {

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name, mimeType)',
    });
    res.status(200).json(response.data.files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ message: 'Error listing files' });
  }
};

// Function to get settings of a specific file by file ID
exports.getFileSettings = async (req, res) => {
  const { fileId } = req.params;

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, permissions, owners',
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching file settings:', error);
    res.status(500).json({ message: 'Error fetching file settings' });
  }
};

// Function to get settings of a specific file by file ID
exports.getFileSettingsById = async (req, res) => {
  const { fileId } = req.params; // Get fileId from the URL parameters

  if (!fileId) {
      return res.status(400).json({ message: 'File ID is required' });
  }

  try {
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const response = await drive.files.get({
        fileId: fileId,
        fields: '*', 
        // fields: 'id, name, mimeType, permissions, owners, webViewLink, webContentLink, createdTime, modifiedTime, size, version, shared, sharingUser, viewersCanCopyContent, writersCanShare, copyRequiresWriterPermission, hasThumbnail, thumbnailLink', // Add all necessary fields here
        //getting all fields
    //     fields: `
    //     id, 
    //     name, 
    //     mimeType, 
    //     permissions, 
    //     owners, 
    //     shared, 
    //     sharingUser, 
    //     webViewLink, 
    //     webContentLink, 
    //     createdTime, 
    //     modifiedTime, 
    //     viewersCanCopyContent, 
    //     writersCanShare, 
    //     copyRequiresWriterPermission, 
    //     hasThumbnail
    // `.replace(/\s+/g, ''),
    });
    

      res.status(200).json(response.data);
  } catch (error) {
      console.error('Error fetching file settings:', error);
      res.status(500).json({ message: 'Error fetching file settings' });
  }
};

exports.listDriveFiles = async (req, res) => {
  try {
   
    // let serviceAccountEmail = 'testadmin-pvp-test12-work@project-1724985033144.iam.gserviceaccount.com'; 
    let serviceAccountEmail;
    // const userEmail = 'testadmin@pvp-test-domain2.com';
    const { userEmail } = req.body;
    console.log(`UserEmail: ${userEmail}`);

    let projectData = await dataController.getProjectData(userEmail);
    let projectId = projectData.projectId;
    console.log(`ProjectID: ${projectId}`);

    let serviceAccountData = await dataController.getServiceAccountData(projectId);
    // console.log(`Service Account email: ${serviceAccountData.serviceAccountEmail}`);

    serviceAccountEmail = serviceAccountData.serviceAccountEmail;

    // Retrieve the service account key details from the database
    // let serviceAccountKey = await ServiceAccountKeys.findOne({
    //   where: { serviceAccountEmail: serviceAccountEmail }
    // });

    let serviceAccountKey;

    serviceAccountKey = await dataController.getServiceAccountKey(serviceAccountEmail);

    if (!serviceAccountKey) {
      return res.status(404).json({ message: 'Service account key not found' });
    }

    // Extract the private key data
    // const privateKey = serviceAccountKey.privateKeyData;
    // console.log(privateKey);
    const keyData = decodePrivateKeyData(serviceAccountKey.privateKeyData);
    console.log(keyData);
    const privateKey = keyData.private_key;

    // Create a new JWT client, specifying the user to impersonate
    const jwtClient = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
      subject: userEmail // Impersonating this user
    });

    // Authorize the client
    await jwtClient.authorize();

    // Create a Drive API client
    const drive = google.drive({ version: 'v3', auth: jwtClient });

    // List the files in the user's drive
    const response = await drive.files.list({
      // pageSize: 10,
      // fields: 'files(id, name, mimeType)',
    });

    // Send the list of files as the response
    res.status(200).json(response.data.files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ message: 'Error listing files' });
  }
};

exports.getFileDetails = async (req, res) => {
  try {
    const { email } = req.body;
    const { fileId } = req.params;
    const userEmail = email;
    if (!userEmail || !fileId) {
      return res.status(400).json({ message: 'User email and file ID are required' });
    }

    console.log(`Fetching file details for user: ${userEmail} and file: ${fileId}`);

    // Fetch project data and service account data for impersonation
    const projectData = await dataController.getProjectData(userEmail);
    const serviceAccountData = await dataController.getServiceAccountData(projectData.projectId);

    const serviceAccountKey = await dataController.getServiceAccountKey(serviceAccountData.serviceAccountEmail);
    if (!serviceAccountKey) {
      return res.status(404).json({ message: 'Service account key not found' });
    }

    // Decode the private key
    const privateKey = decodePrivateKeyData(serviceAccountKey.privateKeyData).private_key;

    // Create a JWT client, impersonating the user
    const jwtClient = new google.auth.JWT({
      email: serviceAccountData.serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
      subject: userEmail, // Impersonating this user
    });

    // Authorize the JWT client
    await jwtClient.authorize();

    // Create the Google Drive API client
    const drive = google.drive({ version: 'v3', auth: jwtClient });

    // Get the file metadata for the specified fileId
    const response = await drive.files.get({
      fileId: fileId,
      fields: '*', // You can specify specific fields you want to retrieve, or '*' for all fields
    });

    // Send the file details as the response
    res.status(200).json(response.data);

  } catch (error) {
    console.error('Error fetching file details:', error);
    res.status(500).json({ message: 'Error fetching file details' });
  }
};
