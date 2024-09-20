

'use client';
import FileSettings from "../../../../../../app/ui/components/FileSettings";
import { LoggedInUserProvider } from "../../../../../../app/ui/contexts/LoggedInUserContext";
import { useParams, useSearchParams } from 'next/navigation';

/**
 * Page component for displaying file settings.
 * 
 * This page component displays the file ID and the email that is being impersonated.
 * It also provides the `LoggedInUserProvider` context to the `FileSettings` component,
 * which is used to impersonate the user and fetch the file settings.
 * 
 * This page is accessible at the route `/drive/mydrive-files/file-settings/:id`
 * and expects the `id` parameter to be passed in the URL.
 * The `email` parameter is expected to be passed in the query parameters.
 * 
 * @param {string} id The file ID to display settings for.
 * @param {string} email The email to impersonate.
 * @returns {React.ReactElement} The JSX for the page.
 */
export default function Page() {
    const { id } = useParams(); // Extract the file ID from the URL
    const searchParams = useSearchParams(); // Use useSearchParams to get query parameters
    const email = searchParams.get('email'); // Extract the email from query parameters

    return (
        <div>
            <h1>File Settings</h1>
            <p>Details for file ID: {id}</p>
            <p>Impersonating Email: {email}</p> {/* Display the email to verify */}
            <LoggedInUserProvider>
                <div>
                    {/* Pass the fileId and email to FileSettings */}
                    <FileSettings fileId={id} emailToImpersonate={email} />
                </div>
            </LoggedInUserProvider>
        </div>
    );
}
