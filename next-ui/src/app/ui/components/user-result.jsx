import { Button } from '@/components/ui/button'
import { groupsStyles, groupElementIds, groupStrings } from '@/app/ui/variables/group-variables'
import UserResultsTable from './user-table'

const Result = ({ setShowResult }) => {
  return (
    <>
      <span className="text-lg text-muted-foreground">Search results</span>
      <div className="flex flex-col lg:flex-row gap-x-4">
        <Button className={`${groupsStyles.buttonPadding} float-right`} onClick={() => setShowResult(false)}>
          Refine search conditions
        </Button>
      </div>
      <UserResultsTable />
    </>
  )
}

export default Result
