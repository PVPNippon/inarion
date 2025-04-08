/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const path = require('path')

const getCallerInfo = () => {
  // Create a new error to capture the stack trace
  const stack = new Error().stack.split('\n')

  // Select the 3rd stack line (index 3 in a 0-based array)
  const relevantStackIndex = 3
  const callerLine = stack[relevantStackIndex]?.trim()

  // If no caller line is found, return default unknown values
  if (!callerLine) {
    return { functionName: 'Unknown', lineNumber: '' }
  }

  // Match and extract function name, file path, and line/column numbers
  const match =
    callerLine.match(/at (\S+) \((.*):(\d+):(\d+)\)/) || // Format: at functionName (filePath:line:column)
    callerLine.match(/at (.*):(\d+):(\d+)/) // Format: at filePath:line:column (no function name)

  return match
    ? {
        functionName: match[1], // Extracted function name
        lineNumber: match[3] && match[4] ? `${match[3]}:${match[4]}` : '', // Line and column numbers
      }
    : { functionName: 'Unknown', lineNumber: '' }
}

module.exports = getCallerInfo
