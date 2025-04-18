/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

import axios from 'axios'
import { apiCall, testFunction, decryptServerResponse } from './securePayload'
// import { privateKey } from './keys'
import { enc } from 'crypto-js'
const API_BASE_URL = 'http://localhost:4000'
export async function apiClient(url, method = 'GET', data = null, headers = {}, withCredentials = false) {
  try {
    const privateKey = await axios.get(`${API_BASE_URL}/encryption/server-private-key`)
    // console.log(data)
    const encryptedData = await apiCall(url, data, method)
    console.log('***********************************************')
    console.log('Encrypted Data:', encryptedData)
    console.log(encryptedData.data.encryptedAESKey)
    console.log('private key:', privateKey.data.serverPrivateKey)

    const result = decryptServerResponse(
      encryptedData.data.encryptedAESKey,
      encryptedData.data.encryptedIV,
      encryptedData.data.payload,
      privateKey.data.serverPrivateKey
    )
    console.log('Decrypted the response from server')

    return result
    // return encryptedData.data
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.data)
      throw new Error(error.response.data.message || 'API call failed')
    } else if (error.request) {
      console.error('No response from server:', error.request)
      throw new Error('No response from server')
    } else {
      console.error('Error in API call:', error.message)
      throw new Error('Error in API call')
    }
  }
}
