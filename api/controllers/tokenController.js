/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

// controllers/tokenController.js
const jwt = require('jsonwebtoken')
const config = require('../config/config')
let refreshTokens = []

const generateAccessToken = (user) => {
  return jwt.sign(user, config.JWT_ACCESS_SECRET, { expiresIn: '60s' })
}

const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(user, config.JWT_REFRESH_SECRET)
  refreshTokens.push(refreshToken)
  return refreshToken
}

exports.token = (req, res) => {
  const { token } = req.body
  if (!token) return res.sendStatus(401)
  if (!refreshTokens.includes(token)) return res.sendStatus(403)

  jwt.verify(token, config.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = generateAccessToken({ email: user.email })
    res.json({ accessToken })
  })
}

exports.logout = (req, res) => {
  const { token } = req.body
  refreshTokens = refreshTokens.filter((t) => t !== token)
  res.sendStatus(204)
}

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, config.JWT_ACCESS_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}
