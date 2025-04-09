/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const MIME_TYPES_MAP = {
  audio: 'application/vnd.google-apps.audio',
  document: 'application/vnd.google-apps.document',
  driveSdk: 'application/vnd.google-apps.drive-sdk',
  drawing: 'application/vnd.google-apps.drawing',
  file: 'application/vnd.google-apps.file',
  folder: 'application/vnd.google-apps.folder',
  form: 'application/vnd.google-apps.form',
  fusiontable: 'application/vnd.google-apps.fusiontable',
  jam: 'application/vnd.google-apps.jam',
  mailLayout: 'application/vnd.google-apps.mail-layout',
  map: 'application/vnd.google-apps.map',
  photo: 'application/vnd.google-apps.photo',
  presentation: 'application/vnd.google-apps.presentation',
  script: 'application/vnd.google-apps.script',
  shortcut: 'application/vnd.google-apps.shortcut',
  site: 'application/vnd.google-apps.site',
  spreadsheet: 'application/vnd.google-apps.spreadsheet',
  unknown: 'application/vnd.google-apps.unknown',
  vid: 'application/vnd.google-apps.vid',
  video: 'application/vnd.google-apps.video',
}

// Create a reverse map for easy lookup
const MIME_TYPES_REVERSE_MAP = Object.fromEntries(Object.entries(MIME_TYPES_MAP).map(([key, value]) => [value, key]))

// Utility function to get MIME type by key or vice versa
const getMimeTypeOrKey = (input) => {
  if (MIME_TYPES_MAP[input]) {
    return MIME_TYPES_MAP[input] // Convert key to MIME type
  } else if (MIME_TYPES_REVERSE_MAP[input]) {
    return MIME_TYPES_REVERSE_MAP[input] // Convert MIME type to key
  } else {
    return null // Return null if input is not found
  }
}

module.exports = {
  MIME_TYPES_MAP,
  getMimeTypeOrKey,
}
