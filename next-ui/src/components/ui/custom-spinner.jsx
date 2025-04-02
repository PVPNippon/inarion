function CustomSpinner({ spinnerColor, strokeWidth }) {
  spinnerColor = spinnerColor || '#ef5039'
  strokeWidth = strokeWidth || 4
  return (
    <div className="spinner-wrapper">
      <svg className="spinner" viewBox="0 0 50 50">
        <circle className="path" cx="25" cy="25" r="20" fill="none" stroke={spinnerColor} strokeWidth={strokeWidth} />
      </svg>
    </div>
  )
}

function CustomSpinnerComponentWithText({ text, spinnerColor, strokeWidth }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <CustomSpinner spinnerColor={spinnerColor} strokeWidth={strokeWidth} />
      <p className="text-gray-600 text-sm font-medium">{text}</p>
    </div>
  )
}

export { CustomSpinner, CustomSpinnerComponentWithText }
