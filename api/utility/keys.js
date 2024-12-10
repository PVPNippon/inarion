const fs = require('fs')
const path = require('path')

const clientPrivateKey = fs.readFileSync(path.join(__dirname, '../keys/client_rsa_keys/private.pem'), 'utf8')
const clientPublicKey = fs.readFileSync(path.join(__dirname, '../keys/client_rsa_keys/public.pem'), 'utf8')

const serverPrivateKey = fs.readFileSync(path.join(__dirname, '../keys/server_rsa_keys/private.pem'), 'utf8')
const serverPublicKey = fs.readFileSync(path.join(__dirname, '../keys/server_rsa_keys/public.pem'), 'utf8')

module.exports = {
  clientPrivateKey,
  clientPublicKey,
  serverPrivateKey,
  serverPublicKey,
}
