const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); 
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`)))
  .catch(err => console.log(err));


// Middleware to check authentication
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send('Unauthorized');
    req.userId = decoded.userId;
    next();
  });
};

// Retrieve user's favorites
app.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('favorites');
    if (!user) return res.status(404).send('User not found');

    res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    console.error('Error retrieving favorites:', error);
    res.status(500).send('Server error');
  }
});

app.post('/favorites/add', authMiddleware, async (req, res) => {
  const { movieId } = req.body;
  
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).send('User not found');
    
    if (!user.favorites.includes(movieId)) {
      user.favorites.push(movieId);
      await user.save();
      res.status(200).json({ movie: movieId });
    } else {
      res.status(400).send('Movie already in favorites');
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).send('Server error');
  }
});

app.post('/favorites/remove', authMiddleware, async (req, res) => {
  const { movieId } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).send('User not found');

    if (user.favorites.includes(movieId)) {
      user.favorites = user.favorites.filter(id => !id.equals(movieId));
      await user.save();
      res.status(200).send('Removed from favorites');
    } else {
      res.status(400).send('Movie not in favorites');
    }
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).send('Server error');
  }
});

const authRoutes = require('./routes/auth');
const moviesRoutes = require('./routes/movies');


app.use('/auth', authRoutes);

app.use('/movies', moviesRoutes);
