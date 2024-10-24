// Import necessary configurations and utility functions
const { getCredentials, initializeGoogleAuth, impersonateClient } = require('../config/googleDriveConfig');
const config = require('../config/config');
const { extractEmails, printHierarchy } = require('../utility/utilityFunctions');
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
async function getDriveInstance(user, serviceAccountEmail, serviceAccountPrivateKey) {
  try {
    // The service account email, which is used to authenticate API requests, is retrieved from the configuration file.
    // const serviceAccountEmail = config.CLIENT_SERVICE_ACCOUNT_EMAIL;

    // Fetch the service account credentials from the database and decode them.
    const credentials = await getCredentials(serviceAccountEmail, serviceAccountPrivateKey);

    // Initialize the Google Auth client using the retrieved credentials.
    const auth = await initializeGoogleAuth(credentials);

    // Impersonate the specified user (the one provided in the function argument) to access their Google Drive.
    return impersonateClient(user, auth);
  } catch (error) {
    // Log and throw a descriptive error if there's an issue initializing the Google Drive instance.
    throw new Error(`Failed to initialize Google Drive for user ${user}: ${error.message}`);
  }
}

/**
 * Fetches all files from a Google Drive, supporting both personal and shared drives.
 * Handles pagination if there are multiple pages of files.
 * 
 * @param {Object} drive - The authenticated Google Drive instance.
 * @param {string|null} driveId - The ID of the shared drive, or null for personal drive.
 * @returns {Promise<Array>} - A promise that resolves to an array of files.
 */
const fetchFilesFromDrive = async (drive, driveId = null) => {
  let nextPageToken = null;  // Token to manage pagination
  let files = [];  // Container for all files retrieved
  let filesResponse;  // Response from the API

  do {
    try {
      if (driveId) {
        // For shared drives, include specific parameters like 'driveId' and 'supportsAllDrives'
        filesResponse = await drive.files.list({
          corpora: 'drive',
          driveId: driveId,
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, parents, size)', 
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, parents, size)', 
          q: 'trashed=false', 
          pageToken: nextPageToken,
        });
      } else {
        // For personal drives, only the 'user' corpora is required
        filesResponse = await drive.files.list({
          corpora: 'user', 
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, parents, size)', 
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, parents, size)', 
          q: 'trashed=false',
          pageToken: nextPageToken,
        });
      }

      // Append the fetched files to the files array
      files.push(...filesResponse.data.files);

      // Store the next page token for pagination
      nextPageToken = filesResponse.data.nextPageToken;
    } catch (error) {
      // Log the error and rethrow it if file fetching fails
      console.error('Error fetching files:', error.message);
      throw error;
    }
  } while (nextPageToken);  // Continue fetching files while there are more pages

  return files;  // Return all fetched files
};

/**
 * Organizes a file into a hierarchical structure based on its parent relationships.
 * This is a recursive function that arranges files and folders in a tree-like format.
 * 
 * @param {Object} file - The file object from Google Drive API.
 * @param {Map} fileMap - A map of all files where the key is the file ID.
 * @param {Array} rootItems - Array holding root-level files/folders.
 * @param {string} rootFolderId - The ID of the root folder.
 * @param {number} currentDepth - The current depth in the hierarchy (starts at 1).
 * @param {string} parentPath - The parent path for the current file.
 * @param {string} driveName - The name of the Google Drive (for display purposes).
 * @returns {Object} - The file node with updated hierarchy and path information.
 */

const organizeFileInHierarchy = (file, fileMap, rootItems, currentDepth, parentPath, driveName) => {
  // Full path is built based on the current file's name and parent path
  const fullPath = currentDepth === 1 && parentPath === '' ? `${driveName}/${file.name}` : `${parentPath}/${file.name}`;

  // Create a file node with its depth, type (folder/file), path, and children
  const fileNode = { 
    ...fileMap.get(file.id),  // Retrieve the file from the map
    depth: currentDepth,  // Assign the current depth level 
    type: file.mimeType.includes('application/vnd.google-apps.folder') ? 'folder' : 'file',  // Determine if it's a folder
    path: fullPath,  // Assign the full path
    lastModified: file.modifiedTime,
    parentId: file.parents && file.parents.length > 0 ? file.parents[0] : null,  // Assign parent ID if it exists
    children: [],  // Initialize empty children array (to be filled recursively)
    fileCount: 0,  // Initialize file count
    folderCount: 0,  // Initialize folder count
    totalSize: file.size ? parseInt(file.size, 10) : 0,  // Initialize total size with the file's size (0 if not present)
 
  };

  // If the file has a parent, try to attach it to its parent node
  if (file.parents && file.parents.length > 0) {
    const parentId = file.parents[0];

    const parent = fileMap.get(parentId);  // Retrieve parent file from map
    if (parent) { 
      // Avoid duplicates by checking if the file is already added to its parent
      if (!parent.children.some(child => child.id === file.id)) {
        parent.children.push(fileNode);  // Add the file as a child of its parent
      }
    } else {
      // If the parent is not found, treat the file as a root-level item
      if (!rootItems.some(rootItem => rootItem.id === file.id)) {
        rootItems.push(fileNode);
      }
    }
  } else {
    // Handle root-level files (files without parents)
    if (!rootItems.some(rootItem => rootItem.id === file.id)) {
      rootItems.push(fileNode);
    }
  }

  // If the file is a folder, recursively organize its children
  if (file.mimeType.includes('application/vnd.google-apps.folder')) {
    // Loop through each file to find its children
    for (let childFile of fileMap.values()) {
      if (childFile.parents && childFile.parents[0] === file.id) {
        const childNode = organizeFileInHierarchy(childFile, fileMap, rootItems, currentDepth + 1, fileNode.path, driveName);
        fileNode.children.push(childNode);
      }
    }
  }

  // Return the updated file node
  return fileNode;
};
/**
 * Builds a hierarchical structure from a flat list of files.
 * 
 * @param {Array} files - The flat list of files to be organized into a hierarchy.
 * @param {string} rootFolderId - The ID of the root folder (typically 'root' for personal drives).
 * @param {string} driveName - The name of the Google Drive (for labeling purposes).
 * @returns {Array} - A hierarchical tree of files and folders.
 */
const buildHierarchy = (files, rootFolderId, driveName) => {
  const fileMap = new Map();  // A map to store all files with their IDs
  const rootItems = [];  // Array to store root-level items (files and folders)

  // First, add all files to the fileMap
  for (let file of files) {
    fileMap.set(file.id, { ...file, children: [] });  // Initialize each file with an empty children array
  }

  // Then, organize files based on their parent relationships
  for (let file of files) {
    // organizeFileInHierarchy(file, fileMap, rootItems, rootFolderId, driveName);  
    organizeFileInHierarchy(file, fileMap, rootItems, 1, '', driveName);  
  }

  return rootItems;  // Return the fully built hierarchy
};

/**
 * Fetches files from a Google Drive (shared or personal) and builds a hierarchical structure.
 * 
 * @param {Object} drive - The authenticated Google Drive instance.
 * @param {string} driveName - The name of the Google Drive.
 * @param {boolean} isSharedDrive - Boolean indicating whether this is a shared drive.
 * @param {string} rootFolderId - The ID of the root folder or shared drive.
 * @returns {Object} - An object representing the drive and its file hierarchy.
 */
const fetchAndBuildDriveFiles = async (drive, driveName, isSharedDrive, rootFolderId) => {
  // Fetch all files for the specified drive (shared or personal)
  const files = await fetchFilesFromDrive(drive, isSharedDrive ? rootFolderId : null);

  // Build the hierarchical structure for the fetched files
  const children = buildHierarchy(files, rootFolderId, driveName);

  // If sahred drive then return the id as well
  const driveId = rootFolderId;
  if(isSharedDrive)
    return {
      driveId, // ID of the shared drive
      driveName,  // Name of the drive
      depth: 0,  // Root of the drive has depth 0
      path: driveName,  // Root path is the drive's name
      children,  // Hierarchical structure of files and folders
    }
  // Return the drive structure including the hierarchy
  return {
    driveName,  // Name of the drive
    depth: 0,  // Root of the drive has depth 0
    path: driveName,  // Root path is the drive's name
    children,  // Hierarchical structure of files and folders
  };
};

/**
 * Fetches all shared drives and their files, building a hierarchical structure for each drive.
 * 
 * @returns {Promise<Array>} - A promise that resolves to an array of shared drives with their file hierarchies.
 */
const fetchAllSharedDrives = async (userEmail, serviceAccountEmail, serviceAccountPrivateKey) => {
  try {
    // const drive = await getDriveInstance(config.SUPER_ADMIN_EMAIL);
    const drive = await getDriveInstance(userEmail, serviceAccountEmail, serviceAccountPrivateKey);  // Get Google Drive instance as super admin
    // Get Google Drive instance as super admin
    const drivesResponse = await drive.drives.list();  // Fetch all shared drives
    const sharedDrives = drivesResponse.data.drives || [];  // Fallback to an empty array if no drives are found
    const sharedDrivesWithFiles = [];  // Array to store drives and their files

    for (const sharedDrive of sharedDrives) {
      // Fetch and build the hierarchy for each shared drive
      const driveFiles = await fetchAndBuildDriveFiles(drive, sharedDrive.name, true, sharedDrive.id);
      sharedDrivesWithFiles.push(driveFiles);  // Add the built hierarchy to the array
    }

    return sharedDrivesWithFiles;  // Return the array of shared drives with their file structures
  } catch (error) {
    // Log any errors that occur while fetching shared drives
    console.error('Error fetching shared drives and their file metadata:', error.message);
    throw error;
  }
};

/**
 * Fetches all personal drives and their files, building a hierarchical structure for each user.
 * 
 * @returns {Promise<Array>} - A promise that resolves to an array of personal drives with their file hierarchies.
 */
const fetchPersonalDriveFiles = async ( adminEmail, projectId, serviceAccountEmail, serviceAccountPrivateKey) => {
  try {
    let usersEmailsList = await axios.post(
      `${API_BASE_URL}/users/users-list`,
      {
        userEmail: adminEmail, 
        projectId: projectId,
        serviceAccountEmail: serviceAccountEmail,
        serviceAccountPrivateKey: serviceAccountPrivateKey, 
      },
      {
        withCredentials: true, // Include session cookies
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    const emailList = usersEmailsList.data.map(user => user.primaryEmail);
    const personalDrivesWithFiles = [];  // Array to store personal drives and their files

    for (const email of emailList) {
      
      try {
        const drive = await getDriveInstance(email, serviceAccountEmail, serviceAccountPrivateKey);  // Get Google Drive instance for the user

        // Fetch and build hierarchy for the user's personal drive
        const driveFiles = await fetchFilesFromDrive(drive, null);  // Fetch files from user's personal drive
        const hierarchy = buildHierarchy(driveFiles, 'root', config.PERSONAL_DRIVE_NAME);  // Build hierarchy, with 'my-drive' as the root name

        // Create a node for the personal drive
        const personalDriveNode = {
          email: email,  // Store user's email
          driveName: config.PERSONAL_DRIVE_NAME,  // Personal drive name
          depth: 0,  // Root level depth
          path: config.PERSONAL_DRIVE_NAME,  // Root path as 'my-drive'
          children: hierarchy,  // Hierarchical structure of files and folders
        };

        personalDrivesWithFiles.push(personalDriveNode);  // Add the drive structure to the array

      } catch (error) {
        // Log any errors that occur while processing a specific user's drive
        console.error(`Failed to process email ${email}:`, error.message);
      }
    }

    return personalDrivesWithFiles;  // Return the array of personal drives with their file structures
  } catch (error) {
    // Log any errors that occur while fetching personal drives
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
async function fetchFilesDetailsData(emailToImpersonate, fileId,  serviceAccountEmail, serviceAccountPrivateKey) {

  // Get the Google Drive instance using the impersonated user's email.
  let drive = await getDriveInstance(emailToImpersonate, serviceAccountEmail, serviceAccountPrivateKey);


// Get the metadata of the file identified by the fileId from the user's Google Drive.
  // 'fields: *' retrieves all available fields for the file metadata.
  const fileData = await drive.files.get({
      fileId: fileId,
      fields: '*', // We can specify specific fields you want to retrieve, or '*' for all fields
    });

  // Return the file's metadata.
    return(fileData.data);
}

/**
 * Formats a given size in bytes into a human-readable string, either in KB or MB.
 *
 * This helper function dynamically converts the size in bytes to KB or MB based on the value.
 * If the size is less than 1MB, it will be shown in KB; otherwise, it will be shown in MB.
 *
 * @param {number} sizeInBytes - The file size in bytes.
 * @returns {string} - The formatted size as a string with two decimal places, either in KB or MB.
 */
const formatSize = (sizeInBytes) => {
  if (sizeInBytes < 1024 * 1024) {
    // If size is less than 1MB, show in KB
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else {
    // If size is 1MB or more, show in MB
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }
};


/**
 * Builds the full path of a file by recursively traversing its parent folders.
 *
 * This function constructs the full path to a file or folder by looking up its parent directories,
 * starting from the file itself and walking upwards through the parent hierarchy until the root folder.
 *
 * @param {Object} file - The file or folder for which the full path is being constructed.
 * @param {Array} files - The list of all files and folders, used to look up parent directories.
 * @returns {string} - The full path of the file or folder, starting from the root.
 */
const buildFilePath = (file, files) => {
  let path = file.name;
  let parentId = file.parents && file.parents.length > 0 ? file.parents[0] : null;

  while (parentId) {
    const parentFile = files.find(f => f.id === parentId);
    if (parentFile) {
      path = `${parentFile.name}/${path}`;
      parentId = parentFile.parents && parentFile.parents.length > 0 ? parentFile.parents[0] : null;
    } else {
      break;
    }
  }
  return path;
};

/**
 * Fetches files and folders from a shared or personal drive, calculates total storage usage, 
 * and organizes the files into a hierarchical structure. The function also collects details 
 * about individual files and folders.
 *
 * @param {Object} drive - The Google Drive API instance.
 * @param {string} driveName - The name of the drive being processed.
 * @param {boolean} isSharedDrive - A flag indicating if the drive is a shared drive.
 * @param {string} rootFolderId - The ID of the root folder of the drive.
 * @returns {Object} - An object containing total storage, file count, file details, folder details, and hierarchy.
 */
const fetchAndBuildDriveFilesWithStorage = async (drive, activityService, driveName, isSharedDrive, rootFolderId) => {

  // Fetch all files for the specified drive (shared or personal), including size
  const files = await fetchFilesFromDrive(drive, isSharedDrive ? rootFolderId : null);

  // Calculate total storage usage and total number of files
  const totalStorage = files.reduce((acc, file) => {
    return acc + (file.size ? parseInt(file.size, 10) : 0);
  }, 0);

  const totalFiles = files.length;  // Count the total number of files

  // Sort files by size (largest first)
  const filesBySize = files
    .filter(file => file.size)  // Only include files with a size
    .sort((a, b) => b.size - a.size);

  // Initialize arrays to hold file and folder details
  const fileDetails = [];
  const folderDetails = [];

  console.log(`Drive Name: ${driveName}`);
  console.log(`Total Storage Used: ${formatSize(totalStorage)}`);
  console.log(`Total Number of Files: ${totalFiles}`);

  // Helper function to fetch activity data (downloads, views, active users)
  const getFileActivity = async (fileId) => {
    try {
      // const act = await activityService.acti
      const activity = await activityService.activity.query({
        resource: {
          // pageSize: 10,
          // filter: `detail.action_detail_case:VIEW OR detail.action_detail_case:DOWNLOAD`,
          // filter: 'detail.action_detail_case:(VIEW OR DOWNLOAD) AND time >= "2023-01-01T00:00:00Z"',

          // itemName: `items/${fileId}`,
          // "pageSize": 10,
          // ancestorName: `items/${fileId}`, // Use ancestorName
          ancestorName:`items/root`,
          // filter: "time >= \"2018-01-01T00:00:00-05:00\""
          // itemName: `items/${fileId}`,
          // pageSize: 10,
          // Include the filter if needed
          // filter: 'detail.action_detail_case:(VIEW OR DOWNLOAD)',

        }
      });
     
      return activity.data.activities || [];
    } catch (error) {
      console.error(`Error fetching activity for file ${fileId}:`, error.message);
      return [];
    }
  };

  // Helper function to calculate active users from activity data
  const getActiveUsers = (activities) => {
    const userActions = {};
    activities.forEach(act => {
      const user = act.actors[0]?.user?.knownUser?.personName || 'Unknown User';
      if (!userActions[user]) {
        userActions[user] = 0;
      }
      userActions[user] += 1;
    });
    return Object.entries(userActions)
      .map(([user, count]) => ({ user, actions: count }))
      .sort((a, b) => b.actions - a.actions);  // Sort by action count
  };

  // Loop through files and folders to separate them and collect details
  for (const file of files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      // If it's a folder, count the number of files inside it
      const folderFileCount = files.filter(f => f.parents && f.parents.includes(file.id)).length;

      // For folders, you might decide whether to fetch activity or not
      // Skipping activity fetch for folders in this example

      folderDetails.push({
        folderName: file.name,
        folderFileCount,
        folderPath: buildFilePath(file, files)  // Use buildFilePath to construct the full path
      });

      console.log(`Folder: ${file.name}, Files inside: ${folderFileCount}`);
    } else {
      // If it's a file, fetch activity data
      const activities = await getFileActivity(file.id);
      const activeUsers = getActiveUsers(activities);
      const viewsAndDownloads = activities.length;  // Number of views/downloads

      // Store file details including activity data
      fileDetails.push({
        fileName: file.name,
        fileSize: formatSize(file.size),
        filePath: buildFilePath(file, files),  // Use buildFilePath to construct the full path
        viewsAndDownloads,  // Number of views/downloads
        activeUsers  // Users most active on the file
      });

      console.log(`${file.name}: ${formatSize(file.size)}, Views/Downloads: ${viewsAndDownloads}`);
    }
  }

  // Build the hierarchical structure for the fetched files and folders
  const children = buildHierarchy(files, rootFolderId, driveName);
  printHierarchy(children);  // Optional: Print hierarchy for debugging purposes

  // Return the result, including drive name, total storage, file count, and details of files and folders
  return {
    driveName,
    totalFiles,  // Total number of files in the drive/folder
    totalStorage: formatSize(totalStorage),  // Total storage used in MB or KB
    depth: 0,
    path: driveName,
    children,
    fileDetails,  // File details including name, size, path, views/downloads, active users
    folderDetails  // Folder details including name, file count, and path
  };
};



/**
 * Fetches all shared drives and their file storage usage breakdown for the given user.
 * This function retrieves all shared drives, fetches the files within them, 
 * and calculates the total storage used, along with file details and folder hierarchy.
 *
 * @param {string} userEmail - The email address of the user whose shared drives are being fetched.
 * @param {string} serviceAccountEmail - The email of the service account used to access Google Drive API.
 * @returns {Promise<Object>} - An object containing the shared drives, their total storage, file details, and folder hierarchy.
 * @throws {Error} - If the API request fails or there is an issue fetching the drives.
 */
const fetchAllSharedDrivesWithStorage = async ( userEmail, serviceAccountEmail, serviceAccountPrivateKey) =>{
  try{
    const { activityService } = await getGoogleServices( serviceAccountEmail, serviceAccountPrivateKey);
    // Get the Google Drive instance
    const drive = await getDriveInstance(userEmail, serviceAccountEmail, serviceAccountPrivateKey);
    // Fetch all shared drives
    const drivesResponse = await drive.drives.list();
    const sharedDrives = drivesResponse.data.drives || [];  // Fallback to an empty array if no drives are found
    // Initialize an array to store shared drives with files
    const sharedDrivesWithFiles = [];
    // Loop through each shared drive and fetch files with storage info
    for (const sharedDrive of sharedDrives){
      const driveFiles = await fetchAndBuildDriveFilesWithStorage(drive, activityService, sharedDrive.name, true, sharedDrive.id);
      sharedDrivesWithFiles.push(driveFiles);  // Add the built hierarchy to the array

    }
    // Return the shared drives with files and storage information
    return sharedDrivesWithFiles;
  } catch (error){
    res.status(500).json({ error: error.message });  
  }
}





const getGoogleServices = async ( serviceAccountEmail, serviceAccountPrivateKey) => {
  try {
    const credentials = await getCredentials(serviceAccountEmail, serviceAccountPrivateKey);

    // Initialize the Google Auth client
    const auth = await initializeGoogleAuth(credentials);

    // Initialize the Google Drive API client
    const drive = google.drive({ version: 'v3', auth });

    // Initialize the Google Workspace Activity API client
    const activityService =  google.driveactivity({ version: 'v2', auth });

    return { activityService }; 
  } catch (error) {
    console.error("Error initializing Google services:", error.message);
    throw error;
  }
};


module.exports = {
  fetchAllSharedDrives,
  fetchPersonalDriveFiles,
  fetchFilesDetailsData,
  getDriveInstance, 
  fetchFilesFromDrive,
  fetchAllSharedDrivesWithStorage,
  getGoogleServices,

};