import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { EllipsisIcon, PlusIcon, ChevronDownIcon } from 'lucide-react'

function FileCardRow({ name, itemId, type, owner, sharedExternally, trashed }) {
  return (
    <Card className="flex items-center justify-between p-4 mb-2 border rounded-lg custom-shadow">
      {/* Row Content */}
      <div className="flex w-full items-center">
        {/* Name */}
        <div className="flex-1">
          <p className="font-medium">{name}</p>
        </div>

        {/* Item ID */}
        <div className="flex-1">
          <p className="text-gray-600 truncate">{itemId}</p>
        </div>

        {/* Type */}
        <div className="flex-1">
          <p>{type}</p>
        </div>

        {/* Owner */}
        <div className="flex-1">
          <p>{owner}</p>
        </div>

        {/* Shared Externally */}
        <div className="flex-1">
          <p>{sharedExternally ? 'Yes' : 'No'}</p>
        </div>

        {/* Trashed */}
        <div className="flex-1">
          <p>{trashed ? 'Yes' : 'No'}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <PlusIcon className="h-5 w-5 cursor-pointer" />
          <ChevronDownIcon className="h-5 w-5 cursor-pointer" />
        </div>
      </div>
    </Card>
  )
}
const files = [
  {
    name: 'Julia’s File',
    itemId: '14rK3kMoKoeWW...',
    type: 'Google Doc',
    owner: 'user@domain.com',
    sharedExternally: true,
    trashed: false,
  },
  {
    name: 'Julia’s File',
    itemId: '14rK3kMoKoeWW...',
    type: 'Google Doc',
    owner: 'user@domain.com',
    sharedExternally: true,
    trashed: false,
  },
  // Add more files here as needed
]

const CustomTable = () => {
  return (
    <div className="space-y-2">
      <Card className="flex items-center justify-between p-4 mb-2 border rounded-lg custom-shadow">
        {/* Row Content */}
        <div className="flex w-full items-center">
          {/* Name */}
          <div className="flex-1">
            <p>Name</p>
          </div>

          {/* Item ID */}
          <div className="flex-1">
            <p className="truncate">Item ID</p>
          </div>

          {/* Type */}
          <div className="flex-1">
            <p>Type</p>
          </div>

          {/* Owner */}
          <div className="flex-1">
            <p>Owner</p>
          </div>

          {/* Shared Externally */}
          <div className="flex-1">
            <p>Shared Externally?</p>
          </div>

          {/* Trashed */}
          <div className="flex-1">
            <p>Trashed</p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <EllipsisIcon className="h-5 w-5 cursor-pointer" />
            <ChevronDownIcon className="h-5 w-5 text-white" />
          </div>
        </div>
      </Card>

      {/* File Rows */}
      {files.map((file, index) => (
        <FileCardRow key={index} {...file} />
      ))}
    </div>
  )
}

export { CustomTable }
