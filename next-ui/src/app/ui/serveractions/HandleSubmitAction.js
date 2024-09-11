'use server'
import axios from 'axios';

  /**
   * Handles a form submission and returns an authorization URL.
   * @param {FormData} FormData - The form data containing an email and project name.
   * @returns {string} - The authorization URL that the user should be redirected to.
   */
export async function getFormData(FormData) {

 try {
    const rawFormData = {
        email: FormData.get('email'),
        projectName: FormData.get('projectName'),
    }
   
    const requestBody = {
        email: rawFormData.email,
        projectName: rawFormData.projectName
    }
   
    const response = await axios.post('http://localhost:4000/auth/register', requestBody);

    return response.data.authUrl;
    
    } catch (error) {
      console.error('Error fetching auth URL:', error);
    }
  };