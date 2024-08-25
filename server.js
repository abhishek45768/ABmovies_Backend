const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('./models/User'); 
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: ['https://abmoviess.netlify.app', 'https://66cae7850c815fcda18796ac--abmoviess.netlify.app'], // List all possible origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all necessary methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
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

// Contact Us Route
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).send('All fields are required');
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Set up email data
  const mailOptions = {
    from: email,
    to: 'abhishekbhardwaj0046@gmail.com',
    subject: `Contact Us Form Submission from ${name}`,
    text: `Message from: ${name}\n\nEmail: ${email}\n\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('Message sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Server error');
  }
});

// Other routes
app.get("/", (req, res) => {
  res.json("done");
});

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

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});
