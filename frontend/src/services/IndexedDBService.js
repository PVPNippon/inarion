/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import { openDB } from 'idb'

// Initialize the IndexedDB with dynamic stores
const initDB = async (storeName) => {
  return openDB('AppDB', 1, {
    upgrade(db) {
      // Create the object store if it doesn't exist
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName)
      }
    },
  })
}

// Function to store data in IndexedDB with dynamic store
export const setIndexedDB = async (storeName, key, value) => {
  const db = await initDB(storeName)
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)
  await store.put(value, key)
  await tx.done
  console.log(`Stored in IndexedDB [${storeName}]: ${key} = ${value}`)
}

// Function to retrieve data from IndexedDB
export const getIndexedDB = async (storeName, key) => {
  const db = await initDB(storeName)
  const tx = db.transaction(storeName, 'readonly')
  const store = tx.objectStore(storeName)
  const value = await store.get(key)
  await tx.done
  console.log(`Retrieved from IndexedDB [${storeName}]: ${key} = ${value}`)
  return value
}

// Function to delete data from IndexedDB
export const deleteIndexedDB = async (storeName, key) => {
  const db = await initDB(storeName)
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)
  await store.delete(key)
  await tx.done
  console.log(`Deleted from IndexedDB [${storeName}]: ${key}`)
}

// Function to clear all data in an object store
export const clearIndexedDB = async (storeName) => {
  const db = await initDB(storeName)
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)
  await store.clear()
  await tx.done
  console.log(`Cleared all data from IndexedDB store [${storeName}]`)
}
