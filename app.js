const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Article = require('./models/Article');

const app = express();

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/scientific-journal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Connection error:', err));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await Article.find().populate('tags');
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/articles/search', async (req, res) => {
  try {
    const { title, author } = req.query;
    let query = {};
    
    if (title) query.title = { $regex: title, $options: 'i' };
    if (author) query.authors = author;
    
    const articles = await Article.find(query).populate('tags');
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});