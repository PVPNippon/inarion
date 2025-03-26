export const groupsStyles = {
  //links/icons
  //secondary chart-5
  secondaryTextChart5: 'text-[#4895F6]',

  //semantic/light mode/success
  semanticLightModeSuccess: '#37B705',

  //semantic/dark mode/failure
  semanticDarkModeFailure: '#F39D3D',

  //buttons
  buttonPadding: 'py-2 px-6 gap-x-2.5', //top-bottom 8px left-right 24px gap 10px
  buttonPaddingWide: 'py-2 px-8 gap-x-2.5', //top-bottom 8px left-right 32px gap 10px

  //border/shadow
  roundBorder: 'border border-input rounded-lg', //radius 8px
  thinShadow: 'shadow-[0_1px_5px_0_rgba(239,80,57,0.08)]',

  //nested table
  searchBarWidth: 'max-w-[627px]',
  searchBarWidthVariantB: 'sm:w-[627px] min-w-[200px]',
  tableRowPadding: 'py-3', //top-bottom 12px
  tableHeaderText: 'text-inherit',

  //member deletion by csv dialog window
  uploadArea: 'h-full w-[704px] border rounded-md flex flex-col justify-center items-center gap-y-2',
  uploadAreaExtended: 'h-[470px] w-[704px] border rounded-md flex flex-col justify-center items-center gap-y-2',

  //groups manager page
  //groups table
  tableHead: 'text-nowrap',
  edgeCell: 'text-nowrap border border-input', //flex is needed for rounded corners, remove it and corners are gone......
  middleCell: 'text-nowrap border border-y border-input border-x-0',
  dummyCell: 'text-[8px] py-0 leading-none hover:bg-background',
  //access settings
  gridHeader: 'flex flex-col items-center align-middle',
  gridColumnName: 'text-center text-[10px]/3 p-2 break-words max-w-[76px] h-[40px]',
  gridRow: 'text-nowrap text-xs text-left py-3 border-none',
  //filters and filter chips
  filterButtonOrChip:
    'flex h-9 gap-2 items-center justify-between whitespace-nowrap rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm shadow-menu1 shadow-menu2 ring-offset-background placeholder:text-muted-foreground focus:outline-none  disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 relative',
}

export const groupElementIds = {
  //nested table
  exportWindowOption1: 'googleSheetFormat',
  exportWindowOption2: 'csvFormat',
  closeExportDialog: 'closeExportDialog',
  csvDownloadButton: 'csvDownloadGroupMemberships',

  //member deletion by csv dialog window
  deleteMembersByCsvFileInput: 'deleteMembersByCsvFileInput',
}

export const groupStrings = {
  //nested table
  defaultExportFileName: 'memberships_for_',

  //member deletion by csv dialog window
  deleteMembersByCsvTemplateLink: '/templates/members-list-sample.csv',
  deleteMembersByCsvTemplateFileName: 'members-list-sample.csv',
  uploadStates: {
    empty: 'empty',
    uploadInProgress: 'uploadInProgress',
    uploadComplete: 'uploadComplete',
    showBadge: 'showBadge',
    showTable: 'showTable',
    deletionInProgress: 'deletionInProgress',
    showDeletionResult: 'showDeletionResult',
  },
  deletionResultStatuses: {
    success: 'success',
    failure: 'failure',
    error: 'error',
  },
}

export const emailRegex = new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
