// Extract emails from JSON data containing information on list if user fetched by directory API
const extractEmails = (users = []) => {
    if (!Array.isArray(users)) {
        throw new TypeError('Expected an array of users');
    }

    return users
        .filter(user => user.primaryEmail)  // Filtering users with primaryEmail
        .map(user => user.primaryEmail);    // Mapping only valid primary emails
};

module.exports = {
    extractEmails,
};