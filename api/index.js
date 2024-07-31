// server file
const express = require('express');
const session = require('express-session');
const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const userRoutes = require('./routes/userRoutes');
const sequelize = require('./config/database');
const cors = require('cors'); // Import the CORS package

//Importing all Models
const User = require('./models/User'); 
const Project = require('./models/Project');
const Token = require('./models/Token');

const ServiceAccount = require('./models/ServiceAccount');

const app = express();
app.use(express.json());
app.use(cors()); // Using CORS middleware

app.use(session({
  secret: config.JWT_ACCESS_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Note: 'secure: false' is used for non-HTTPS (local) development
}));



app.use('/auth', authRoutes);
app.use('/project', projectRoutes);
app.use('/token', tokenRoutes);
app.use('/user', userRoutes);

app.get("/", (req, res) => {
    res.send("<h1>Home Page</h1>");
});

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

const port = config.PORT;
app.listen(port, () => console.log(`Listening on port ${port}`));
