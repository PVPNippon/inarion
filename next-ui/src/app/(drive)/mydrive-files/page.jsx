import ListMyDriveFiles from "@/app/ui/components/ListMyDriveFiles";
import { LoggedInUserProvider } from "@/app/ui/contexts/LoggedInUserContext";

/**
 * Page component for displaying a user's Google Drive files.
 *
 * This page component wraps the `ListMyDriveFiles` component in the `LoggedInUserProvider`
 * context, which provides the user's email to be impersonated.
 *
 * @returns {React.ReactElement} The JSX for the page.
 */
export default function MyDriveFiles() {
    return (
        <div>
            <h1>My Drive File</h1>
            <LoggedInUserProvider>
            <div>
                <ListMyDriveFiles />
            </div>
            </LoggedInUserProvider>
        </div>
    );
}