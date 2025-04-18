/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

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
