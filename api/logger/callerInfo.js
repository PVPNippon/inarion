const path = require('path')

/**
 * Function to get the caller's true location, including the file name and function name.
 * @returns {Object} An object containing the caller's file name and function name.
 */
const getCallerInfo = () => {
  // Create a new error to capture the stack trace
  const stack = new Error().stack.split('\n')

  // Find the line in the stack trace that corresponds to the caller
  const callerLine = stack.find((line) => !line.includes(__filename) && line.includes('at')) // Skip Logger's own calls

  // If no caller line is found, return unknown values
  if (!callerLine) {
    return { fileName: 'Unknown', functionName: 'Unknown' }
  }

  // Match and extract the function name and file path from the caller line
  const match = callerLine.match(/at (\S+) \((.*):\d+:\d+\)/) || callerLine.match(/at (.+):(\d+):\d+/)

  // Return the extracted information, or unknown values if matching fails
  return match
    ? {
        fileName: path.basename(match[2]),
        functionName: match[1] || 'anonymous',
      }
    : { fileName: 'Unknown', functionName: 'Unknown' }
}

module.exports = getCallerInfo
