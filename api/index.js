// server file
const express = require('express')
const session = require('express-session')
const config = require('./config/config')
const authRoutes = require('./routes/authRoutes')
const projectRoutes = require('./routes/projectRoutes')
const tokenRoutes = require('./routes/tokenRoutes')
const userRoutes = require('./routes/userRoutes')
const driveRoutes = require('./routes/driveRoutes')
const domainUsersRoutes = require('./routes/domainUsersRoutes')
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

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));

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


app.get("/", (req, res) => {
    res.send("<h1>Home Page</h1>");
});

const port = config.PORT
app.listen(port, () => console.log(`Listening on port ${port}`))
