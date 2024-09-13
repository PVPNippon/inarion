import ListMyDriveFiles from "@/app/ui/components/ListMyDriveFiles";
import { LoggedInUserProvider } from "@/app/ui/contexts/LoggedInUserContext";

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