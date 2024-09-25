'use client'
import FileSettings from '../../../../ui/components/FileSettings'
import { LoggedInUserProvider } from '../../../../ui/contexts/LoggedInUserContext'
import { useParams, useSearchParams } from 'next/navigation'

/**
 * Page component for displaying file settings.
 *
 * This component fetches the file ID from the URL parameters and the email
 * from the search parameters. It then renders a header with the file ID and
 * impersonating email, and a {@link FileSettings} component with the file ID
 * and email as props.
 *
 * */
export default function Page() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="text-white">
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
  )
}
