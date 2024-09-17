// // /app/drive/mydrive-files/file-settings/[id]/page.jsx
// 'use client';

// import { useParams } from 'next/navigation';

// const FileSettings = () => {
//   const { id } = useParams(); // Get the dynamic route parameter

//   // Fetch and display file details based on the ID
//   // You can use useEffect or other data fetching methods here.

//   return (
//     <div>
//       <h2>File Settings</h2>
//       <p>Details for file ID: {id}</p>
//       <LoggedInUserProvider>
//             <div>
//                 <FileSettings />
//             </div>
//             </LoggedInUserProvider>
//     </div>
//   );
// };

// export default FileSettings;

'use client';
import FileSettings from "@/app/ui/components/FileSettings";
import { LoggedInUserProvider } from "@/app/ui/contexts/LoggedInUserContext";
import { useParams, useSearchParams } from 'next/navigation';

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
