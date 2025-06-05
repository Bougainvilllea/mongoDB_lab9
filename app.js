// Импорт модуля express для создания сервера
const express = require('express');
// Импорт mongoose для работы с MongoDB
const mongoose = require('mongoose');
// Импорт модуля path для работы с путями файловой системы
const path = require('path');
// Импорт модели Article из файла models/Article.js
const Article = require('./models/Article');

// Создание экземпляра приложения express
const app = express();

// Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/scientific-journal', {
  useNewUrlParser: true, // Использовать новый парсер URL
  useUnifiedTopology: true // Использовать новый механизм топологии MongoDB
}) 
.then(() => console.log('Connected to MongoDB')) // При успешном подключении
.catch(err => console.error('Connection error:', err)); // При ошибке подключения

// Middleware
app.use(express.json()); // Парсинг JSON-тела запросов
app.use(express.static(path.join(__dirname, 'public'))); // Обслуживание статических файлов из папки public

// API Routes
// Маршрут для получения всех статей
app.get('/api/articles', async (req, res) => {
  try {
    // Поиск всех статей и заполнение поля tags связанными данными
    const articles = await Article.find().populate('tags');
    // Отправка статей в формате JSON
    res.json(articles);
  } catch (err) {
    // Обработка ошибок с отправкой статуса 500
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для поиска статей
app.get('/api/articles/search', async (req, res) => {
  try {
    // Получение параметров запроса title и author
    const { title, author } = req.query;
    // Создание пустого объекта запроса
    let query = {};
    
    // Если есть параметр title, добавляем в запрос поиск по частичному совпадению (регистронезависимый)
    if (title) query.title = { $regex: title, $options: 'i' };
    // Если есть параметр author, добавляем в запрос поиск по автору
    if (author) query.authors = author;
    
    // Поиск статей по сформированному запросу с заполнением тегов
    const articles = await Article.find(query).populate('tags');
    // Отправка результатов
    res.json(articles);
  } catch (err) {
    // Обработка ошибок
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
const PORT = 3000; // Порт, на котором будет работать сервер
app.listen(PORT, () => {
  // Вывод сообщения при успешном запуске сервера
  console.log(`Server running on http://localhost:${PORT}`);
});
