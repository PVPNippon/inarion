/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

//global in-memory storage
const instanceStore = new Map()
exports.instanceStore = instanceStore

// server file
const express = require('express')
const session = require('express-session')
const logger = require('./logger/logger')(__filename, 'Main')
const config = require('./config/config')
const cronJob = require('node-cron')
const cacheRoutes = require('./routes/cacheRoutes')
const authRoutes = require('./routes/authRoutes')
const projectRoutes = require('./routes/projectRoutes')
const tokenRoutes = require('./routes/tokenRoutes')
const userRoutes = require('./routes/userRoutes')
const driveRoutes = require('./routes/driveRoutes')
const domainUsersRoutes = require('./routes/domainUsersRoutes')
const groupsRoutes = require('./routes/groupsRoutes')
const usersRoutes = require('./routes/usersRoutes')
const domainsRoutes = require('./routes/domainsRoutes')
const encryptionRoutes = require('./routes/cryptoRoutes')
const googleAuthRoutes = require('./routes/googleAuthRoutes')
// const sequelize = require('./config/database');
const cors = require('cors') // Import the CORS package
const path = require('path')

//Importing all Models
const User = require('./models/User')
const Project = require('./models/Project')
const Token = require('./models/Token')

const ServiceAccount = require('./models/ServiceAccount')

const app = express()
app.use(express.json())
// app.use(cors()); // Using CORS middleware

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
)

app.use(
  session({
    secret: config.JWT_ACCESS_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // For development, set true if using https
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day expiration
    }, // Note: 'secure: false' is used for non-HTTPS (local) development
  })
)
// Set the view engine to EJS
app.set('view engine', 'ejs')

// Set the directory for your EJS files
app.set('views', path.join(__dirname, 'views'))

app.use('/auth', authRoutes)
app.use('/project', projectRoutes)
app.use('/token', tokenRoutes)
app.use('/user', userRoutes)
// app.use('/drive', driveRoutes);
app.use('/api/drive', driveRoutes)
app.use('/users', domainUsersRoutes)
app.use('/api/groups', groupsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/domains', domainsRoutes)
app.use('/cache', cacheRoutes)
app.use('/encryption', encryptionRoutes)
app.use('/google', googleAuthRoutes)

app.get('/', (req, res) => {
  res.send('<h1>Home Page</h1>')
})

/// Sync database in development and start server
/// Forces to drop any existingf databases and recreate them everytime we sync

// sequelize.sync({ force: true });
// console.log('Models synchronized successfully');
// sequelize.sync().then(() => {
//   const port = config.PORT;
//   app.listen(port, () => console.log(`Listening on port ${port}`));
// }).catch(err => {
//   console.error('Unable to connect to the database:', err);
// });

const port = config.PORT
app.listen(port, () => logger.info(`Listening on port ${port}`))

// Schedule a cron job to clear the instance store once a day at midnight(might change later)
cronJob.schedule(
  '0 0 * * *',
  () => {
    // Check if the instance store is empty
    if (instanceStore.size === 0) {
      logger.info('Instance store is empty. No need to clear it.')
      return // Exit the cron job
    }
    logger.info('Running cron job')

    // Clear the instance store
    instanceStore.clear()

    // Log the result
    if (instanceStore.size === 0) {
      logger.info('Instance store cleared successfully.')
    } else {
      logger.error(`Failed to clear ${instanceStore.size} items from the instance store.`)
    }
  },
  {
    timezone: 'Asia/Tokyo', // Set the timezone to Tokyo
  }
)
