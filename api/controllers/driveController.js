const { fetchAllSharedDrives, fetchPersonalDriveFiles } = require('../services/driveService');

/**
 * Controller function to handle the request for fetching all shared drives and their file metadata.
 *
 * This function is triggered when the client sends a request to retrieve the list of shared drives along with their files' metadata.
 * It calls the `fetchAllSharedDrives` service function to get the shared drives and their file metadata, then returns the result as a JSON response.
 *
 * @returns {Promise<void>} - Sends a JSON response with the shared drives and their file metadata or an error message.
 */
exports.getSharedDrives = async (req, res) => {
  try {
    const sharedDrivesWithFiles = await fetchAllSharedDrives();
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
  try {
    const personalDriveFiles = await fetchPersonalDriveFiles();
    res.status(200).json(personalDriveFiles);
  } catch (error) {
    console.error('Internal server error:', error);
    res.status(500).json({ error: 'Internal server error' });  
  }
};