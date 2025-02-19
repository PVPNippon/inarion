const fs = require('fs')
const path = require('path')

const localesDir = path.join(__dirname, '../messages') // Path to messages
const cacheDir = path.join(__dirname, '../.cache') // Cache folder
const baseLang = 'en' // Master language
const baseFile = path.join(localesDir, `${baseLang}.json`)
const cacheFile = path.join(cacheDir, 'en_last.json') // Store last known version of en.json

if (!fs.existsSync(baseFile)) {
  console.error(`❌ Base language file ${baseLang}.json not found in ${localesDir}!`)
  process.exit(1)
}

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir)
}

// Read current base translations
const baseTranslations = JSON.parse(fs.readFileSync(baseFile, 'utf-8'))

// Load last known version of base language
let lastBaseTranslations = {}
if (fs.existsSync(cacheFile)) {
  lastBaseTranslations = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
}

// Get all translation files except the base language
const localeFiles = fs.readdirSync(localesDir).filter((file) => file.endsWith('.json') && file !== `${baseLang}.json`)

localeFiles.forEach((file) => {
  const filePath = path.join(localesDir, file)
  const locale = file.replace('.json', '')
  let translations = {}

  if (fs.existsSync(filePath)) {
    translations = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }

  const updatedTranslations = syncKeys(baseTranslations, lastBaseTranslations, translations)

  fs.writeFileSync(filePath, JSON.stringify(updatedTranslations, null, 2), 'utf-8')
  console.log(`✅ Synced: ${file}`)
})

// Save the new version of en.json for future comparison
fs.writeFileSync(cacheFile, JSON.stringify(baseTranslations, null, 2), 'utf-8')

console.log('✨ i18n files updated successfully!')

function syncKeys(base, lastBase, target, path = '') {
  const updated = { ...target }

  for (const key in base) {
    const keyPath = path ? `${path}.${key}` : key // Example: "profile.edit"

    if (!target.hasOwnProperty(key)) {
      // 🛑 Missing Key → Add English text with 🚧🚨
      updated[key] = `🚧🚨 ${base[key]}`
      console.log(`🚧 Missing: ${keyPath} → ${base[key]}`)
    } else if (typeof base[key] === 'object') {
      updated[key] = syncKeys(base[key], lastBase[key] || {}, target[key] || {}, keyPath)
    } else {
      // ✅ Key exists, check if value changed in base language
      if (lastBase[key] !== base[key]) {
        console.log(`⏳🚨 UPDATE: ${keyPath} → ${base[key]}`)
        updated[key] = `⏳🚨 UPDATE: ${base[key]}`
      } else {
        updated[key] = target[key] // Keep translation as is
      }
    }
  }

  return updated
}
