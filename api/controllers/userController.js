// controllers/userController.js
// const pool = require('../models/db');
const User = require('../models/User');



exports.getUser = async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

exports.getData = async (req, res) => {
  try {
    // const data = await pool.query('SELECT * FROM team');
    // res.status(200).send(data.rows);
  } catch (err) {
    res.sendStatus(500);
  }
};
