'use client'

const defaultSize = 20
const defaultStrokeColor = 'hsl(240 10% 3.9%)' //foreground color
const defaultFillColor = 'none'
const defaultStrokeWidth = 1.66667
const defaultStrokeLinecap = 'round'
const defaultStrokeLinejoin = 'round'

function CustomIconExport({
  size = defaultSize,
  viewBox = `0 0 ${size} ${size}`,
  strokeColor = defaultStrokeColor,
  fillColor = defaultFillColor,
  strokeWidth = defaultStrokeWidth,
  strokeLinecap = defaultStrokeLinecap,
  strokeLinejoin = defaultStrokeLinejoin,
}) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill={fillColor} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9.99984 7.49984V5.83317C9.99984 5.39114 10.1754 4.96722 10.488 4.65466C10.8006 4.3421 11.2245 4.1665 11.6665 4.1665H16.6665"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
      <path
        d="M14.1665 1.6665L16.6665 4.1665L14.1665 6.6665"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
      <path
        d="M16.6668 10.8332V14.9998C16.6668 15.4419 16.4912 15.8658 16.1787 16.1783C15.8661 16.4909 15.4422 16.6665 15.0002 16.6665H5.00016C4.55814 16.6665 4.13421 16.4909 3.82165 16.1783C3.50909 15.8658 3.3335 15.4419 3.3335 14.9998V5.83317C3.3335 5.39114 3.50909 4.96722 3.82165 4.65466C4.13421 4.3421 4.55814 4.1665 5.00016 4.1665H6.66683"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
    </svg>
  )
}

export { CustomIconExport }
