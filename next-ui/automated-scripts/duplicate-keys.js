/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const localesDir = path.join(__dirname, '../messages') // Updated path to messages

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question('📂 Enter the JSON filename (e.g., en.json, ja.json): ', (filename) => {
  const filePath = path.join(localesDir, filename)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    rl.close()
    return
  }

  try {
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const jsonData = JSON.parse(rawData)

    const keysSet = new Set()
    const valuesMap = new Map()
    const duplicateKeys = new Set()
    const duplicateValues = new Map()

    function checkDuplicates(obj, parentKey = '') {
      for (const key in obj) {
        const fullKey = parentKey ? `${parentKey}.${key}` : key

        // Check for duplicate keys
        if (keysSet.has(fullKey)) {
          duplicateKeys.add(fullKey)
        } else {
          keysSet.add(fullKey)
        }

        if (typeof obj[key] === 'object') {
          checkDuplicates(obj[key], fullKey) // Recursively check nested objects
        } else {
          // Check for duplicate values
          const value = obj[key]
          if (valuesMap.has(value)) {
            if (!duplicateValues.has(value)) {
              duplicateValues.set(value, [valuesMap.get(value)])
            }
            duplicateValues.get(value).push(fullKey)
          } else {
            valuesMap.set(value, fullKey)
          }
        }
      }
    }

    checkDuplicates(jsonData)

    console.log(`\n🔍 Scanning: ${filePath}`)

    if (duplicateKeys.size > 0) {
      console.log('\n🚨 Duplicate Keys Found:')
      console.log([...duplicateKeys])
    } else {
      console.log('\n✅ No duplicate keys found.')
    }

    if (duplicateValues.size > 0) {
      console.log('\n🔁 Duplicate Values Found:')
      duplicateValues.forEach((keys, value) => {
        if (keys.length > 1) {
          console.log(`"${value}" is used in: ${keys.join(', ')}`)
        }
      })
    } else {
      console.log('\n✅ No duplicate values found.')
    }
  } catch (error) {
    console.error('\n❌ Error reading or parsing JSON:', error.message)
  }

  rl.close()
})
