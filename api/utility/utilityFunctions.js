/**
 * Extracts the primary email addresses from a list of user objects.
 * 
 * This function takes an array of user objects (usually fetched from a directory API) 
 * and filters out users who don't have a `primaryEmail`. It then returns an array of 
 * email addresses from the users that do have a `primaryEmail`.
 * 
 * @param {Array} users - An array of user objects, each potentially containing a `primaryEmail` field.
 * @returns {Array<string>} - An array of primary email addresses.
 * @throws {TypeError} - Throws an error if the input is not an array.
 */
const extractEmails = (users = []) => {
  // Validate that the input is an array, otherwise throw a TypeError.
  if (!Array.isArray(users)) {
      throw new TypeError('Expected an array of users');
  }

  // Filter the users to keep only those that have a primaryEmail, then return an array of these emails.
  return users
      .filter(user => user.primaryEmail)  // Retain only users with a valid primaryEmail field.
      .map(user => user.primaryEmail);    // Extract and return the primaryEmail from each valid user.
};

/**
* Prints the hierarchical structure of items to the console.
* 
* This function recursively prints out a tree-like structure of items (such as files and folders),
* where each level is indented to visually represent the hierarchy. It shows the name of each item
* and recursively prints its children, if any, at the next level of indentation.
* 
* @param {Array} items - An array of items, where each item is an object with a `name` and optionally `children`.
* @param {number} [level=0] - The current level of indentation (defaults to 0 for the root level).
*/
const printHierarchy = (items, level = 0) => {
  // Create an indentation string based on the current level (each level gets one more tab).
  const indent = '\t'.repeat(level); 
  
  // Iterate over each item in the array and print its name with the appropriate indentation.
  items.forEach(item => {
    console.log(`${indent}┗━${item.name}`);  // Print the item with an arrow to indicate its position in the tree.
    
    // If the item has children, recursively call printHierarchy on its children, increasing the indentation level.
    if (item.children && item.children.length > 0) {
      printHierarchy(item.children, level + 1); // Recursive call for each child, with an incremented level.
    }
  });
};

/**
 * Finds an item by its ID or name in a nested hierarchy of items.
 *
 * @param {string} itemIdOrName - The ID or name of the item to search for.
 * @param {Array} children - The array of child items to search through.
 * @returns {Object|null} - The found item or null if not found.
 */
function findItem(itemIdOrName, children) {
  // Base case: If there are no children, return null (item not found)
  if (!children || children.length === 0) {
    return null;
  }

  // Iterate through each child item
  for (let item of children) {
    // Check if the current item matches by ID or name
    if (item.id === itemIdOrName || item.name === itemIdOrName) {
      return item; // Return the item if a match is found
    }

    // If the current item has children, recursively search in its children
    if (item.children && item.children.length > 0) {
      const foundItem = findItem(itemIdOrName, item.children); // Recursive call
      if (foundItem) {
        return foundItem; // Return the item if found in recursive call
      }
    }
  }

  // Return null if the item was not found in the entire hierarchy
  return null;
}

module.exports = {
    extractEmails,
    printHierarchy,
    findItem
};