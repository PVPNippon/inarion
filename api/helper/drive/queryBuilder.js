/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const { MIME_TYPES_MAP } = require('./mimeType')

// for OWNER query, changes should be made in drive contoller function so that only the specifc user's drive or a shared drive is searched
const buildQueryFromFilters = (filters) => {
  // Helper: Formats a value for the query.
  const formatValue = (val) => {
    if (typeof val === 'boolean' || typeof val === 'number') {
      return val
    }
    if (val === 'true' || val === 'false') {
      return val
    }
    const escaped = val.replace(/'/g, "\\'")
    return `'${escaped}'`
  }

  // Helper: Transforms field and value for MIME type.
  // If the field is "type", convert it to "mimeType" and, if possible,
  // replace the value using your MIME_TYPES_MAP.
  const transformFieldAndValue = (field, value) => {
    if (field === 'type') {
      field = 'mimeType'
      if (Array.isArray(value)) {
        value = value.map((v) => MIME_TYPES_MAP[v] || v)
      } else {
        value = MIME_TYPES_MAP[value] || value
      }
    }
    return [field, value]
  }

  // Helper: Formats a single condition object.
  const formatCondition = (condition) => {
    let { field, operator = '=', value, not = false, reverse = false } = condition

    // Special handling for owner/owners.
    if (field === 'owner' || field === 'owners') {
      if (Array.isArray(value)) {
        const orConditions = value.map((v) => `${formatValue(v)} in owners`)
        let conditionStr = `(${orConditions.join(' or ')})`
        if (not) {
          conditionStr = `not ${conditionStr}`
        }
        return conditionStr
      } else {
        let conditionStr = `${formatValue(value)} in owners`
        if (not) {
          conditionStr = `not ${conditionStr}`
        }
        return conditionStr
      }
    }

    // Special handling for sharedWith.
    if (field === 'sharedWith') {
      if (Array.isArray(value)) {
        const orConditions = value.map(
          (v) => `(${formatValue(v)} in owners or ${formatValue(v)} in writers or ${formatValue(v)} in readers)`
        )
        let conditionStr = `(${orConditions.join(' or ')})`
        if (not) {
          conditionStr = `not ${conditionStr}`
        }
        return conditionStr
      } else {
        let conditionStr = `(${formatValue(value)} in owners or ${formatValue(value)} in writers or ${formatValue(
          value
        )} in readers)`
        if (not) {
          conditionStr = `not ${conditionStr}`
        }
        return conditionStr
      }
    }

    // Special handling for linkSharing.
    // This creates a condition on the file's "visibility" field.
    // (Supported values might be 'limited', 'anyoneWithLink', 'anyoneCanFind', 'domain', etc.)
    if (field === 'linkSharing') {
      if (Array.isArray(value)) {
        const orConditions = value.map((v) => `visibility = ${formatValue(v)}`)
        let conditionStr = `(${orConditions.join(' or ')})`
        if (not) {
          conditionStr = `not ${conditionStr}`
        }
        return conditionStr
      } else {
        let conditionStr = `visibility = ${formatValue(value)}`
        if (not) {
          conditionStr = `not ${conditionStr}`
        }
        return conditionStr
      }
    }

    // For other fields, transform if needed (for example "type")
    ;[field, value] = transformFieldAndValue(field, value)

    if (Array.isArray(value)) {
      const orConditions = value.map((v) =>
        reverse ? `${formatValue(v)} ${operator} ${field}` : `${field} ${operator} ${formatValue(v)}`
      )
      let conditionStr = `(${orConditions.join(' or ')})`
      if (not) {
        conditionStr = `not ${conditionStr}`
      }
      return conditionStr
    } else {
      let conditionStr = reverse
        ? `${formatValue(value)} ${operator} ${field}`
        : `${field} ${operator} ${formatValue(value)}`
      if (not) {
        conditionStr = `not ${conditionStr}`
      }
      return conditionStr
    }
  }

  // Handle the array-of-conditions syntax.
  if (Array.isArray(filters)) {
    const queryParts = filters.map((item) => {
      if (typeof item === 'string') {
        return item
      } else if (typeof item === 'object' && item !== null) {
        return formatCondition(item)
      }
      throw new Error('Invalid filter condition: must be an object or a string')
    })
    return queryParts.join(' and ')
  }
  // Handle the simple object syntax.
  else if (typeof filters === 'object' && filters !== null) {
    const queryParts = []
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'owner' || key === 'owners') {
        if (Array.isArray(value)) {
          const orConditions = value.map((v) => `${formatValue(v)} in owners`)
          queryParts.push(`(${orConditions.join(' or ')})`)
        } else {
          queryParts.push(`${formatValue(value)} in owners`)
        }
      } else if (key === 'sharedWith') {
        if (Array.isArray(value)) {
          const orConditions = value.map(
            (v) => `(${formatValue(v)} in owners or ${formatValue(v)} in writers or ${formatValue(v)} in readers)`
          )
          queryParts.push(`(${orConditions.join(' or ')})`)
        } else {
          queryParts.push(
            `(${formatValue(value)} in owners or ${formatValue(value)} in writers or ${formatValue(value)} in readers)`
          )
        }
      }
      // Special handling for linkSharing.
      else if (key === 'linkSharing') {
        if (Array.isArray(value)) {
          const orConditions = value.map((v) => `visibility = ${formatValue(v)}`)
          queryParts.push(`(${orConditions.join(' or ')})`)
        } else {
          queryParts.push(`visibility = ${formatValue(value)}`)
        }
      } else {
        let [transformedKey, transformedValue] = transformFieldAndValue(key, value)
        if (Array.isArray(transformedValue)) {
          const orConditions = transformedValue.map((v) => `${transformedKey} = ${formatValue(v)}`)
          queryParts.push(`(${orConditions.join(' or ')})`)
        } else {
          queryParts.push(`${transformedKey} = ${formatValue(transformedValue)}`)
        }
      }
    }
    return queryParts.join(' and ')
  } else {
    throw new Error('Filters must be an object or an array of condition objects')
  }
}

module.exports = {
  buildQueryFromFilters,
}
