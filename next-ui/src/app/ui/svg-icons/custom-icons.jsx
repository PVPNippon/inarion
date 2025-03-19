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

//removed customization arigs because I don't think this icon is used anywhere else
function CustomIconUserArrow() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0)">
        <path
          d="M2 20.9999C1.99986 19.7061 2.31352 18.4316 2.91408 17.2856C3.51464 16.1396 4.38419 15.1564 5.44815 14.4202C6.51212 13.6841 7.73876 13.2169 9.02288 13.0589C10.307 12.9009 11.6103 13.0567 12.821 13.5129M15 8C15 10.7614 12.7614 13 10 13C7.23858 13 5 10.7614 5 8C5 5.23858 7.23858 3 10 3C12.7614 3 15 5.23858 15 8Z"
          stroke="#71717A"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.1385 16.006L20.1662 16.0063M20.1662 16.0063L18.3835 21.3882M20.1662 16.0063L12.0151 21.8131"
          stroke="#71717A"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0">
          <rect width={24} height={24} fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export { CustomIconExport, CustomIconUserArrow }
