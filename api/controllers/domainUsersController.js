// Function to decrypt the private key
const oauth2Client = require('../models/googleAuth');
const { google } = require('googleapis'); // Google APIs client library
const ServiceAccountKeys = require('../models/ServiceAccountKeys');
const crypto = require('crypto');
const dataController = require('../controllers/dataController');
const encryptionKey = 'my-hardcoded-secret-key'; 


function decodePrivateKeyData(privateKeyData) {
    const decodedData = Buffer.from(privateKeyData, 'base64').toString('utf8');
    return JSON.parse(decodedData);
  }
  

exports.getDomainUsersList = async (req, res) =>{
    const { email } = req.body;

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
        domain: 'pvp-test-domain2.com',
      });
    res.status(200).json(response.data.users);


  

}