const express = require('express');
const axios = require('axios');
const router = express.Router();

// Route to get popular movies
router.get('/popular', async (req, res) => {  // Adjusted route path
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}`);
    res.json(response.data.results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Route to get movie details by ID
// Route to get a movie by ID
router.get('/:id', async (req, res) => {
  const movieId = req.params.id;
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
