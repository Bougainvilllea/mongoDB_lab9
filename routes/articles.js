// Импорт необходимых модулей
const express = require('express'); // Импорт фреймворка Express
const router = express.Router(); // Создание роутера Express
const Article = require('../models/Article'); // Импорт модели Article
const Tag = require('../models/Tag'); // Импорт модели Tag

/* 
 * Роут для получения всех статей с фильтрацией, сортировкой и пагинацией
 * GET /api/articles
 */
router.get('/', async (req, res) => {
  try {
    let query; // Переменная для построения запроса
    
    // Копируем query параметры из URL чтобы не мутировать оригинальный объект
    const reqQuery = { ...req.query };
    
    // Поля, которые нужно исключить из фильтрации
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Удаляем служебные поля из query параметров
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Преобразуем объект query в строку для обработки операторов
    let queryStr = JSON.stringify(reqQuery);
    
    // Добавляем $ к операторам сравнения (gt, gte, lt, lte, in)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Обработка фильтрации по тегам
    if (reqQuery.tags) {
      // Ищем теги по именам из query параметра
      const tags = await Tag.find({ name: { $in: reqQuery.tags.split(',') } });
      // Получаем массив ID найденных тегов
      const tagIds = tags.map(tag => tag._id);
      // Создаем запрос для поиска статей с этими тегами
      query = Article.find({ tags: { $in: tagIds } });
    } else {
      // Если фильтр по тегам не указан, используем обычный запрос
      query = Article.find(JSON.parse(queryStr));
    }
    
    // Обработка выбора конкретных полей (select)
    if (req.query.select) {
      // Преобразуем строку вида 'field1,field2' в 'field1 field2'
      const fields = req.query.select.split(',').join(' ');
      // Добавляем в запрос выбор полей
      query = query.select(fields);
    }
    
    // Обработка сортировки
    if (req.query.sort) {
      // Преобразуем строку вида 'field1,field2' в 'field1 field2'
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // Сортировка по умолчанию - по дате публикации (новые сначала)
      query = query.sort('-publishDate');
    }
    
    // Настройка пагинации
    const page = parseInt(req.query.page, 10) || 1; // Текущая страница (по умолчанию 1)
    const limit = parseInt(req.query.limit, 10) || 10; // Количество элементов на странице (по умолчанию 10)
    const startIndex = (page - 1) * limit; // Индекс первого элемента
    const endIndex = page * limit; // Индекс элемента, следующего за последним на странице
    const total = await Article.countDocuments(); // Общее количество статей
    
    // Добавляем пагинацию в запрос
    query = query.skip(startIndex).limit(limit);
    
    // Выполняем запрос с популяцией тегов (заменяем ID тегов на их имена)
    const articles = await query.populate('tags', 'name').exec();
    
    // Формируем объект пагинации для ответа
    const pagination = {};
    
    // Если есть следующая страница
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    // Если есть предыдущая страница
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    // Отправка успешного ответа
    res.status(200).json({
      success: true,
      count: articles.length, // Количество статей на текущей странице
      pagination, // Информация о пагинации
      data: articles // Массив статей
    });
  } catch (err) {
    // Обработка ошибок сервера
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

/*
 * Роут для получения одной статьи по ID
 * GET /api/articles/:id
 */
router.get('/:id', async (req, res) => {
  try {
    // Поиск статьи по ID с заполнением информации о тегах
    const article = await Article.findById(req.params.id).populate('tags', 'name');
    
    // Если статья не найдена
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    // Отправка найденной статьи
    res.status(200).json({
      success: true,
      data: article
    });
  } catch (err) {
    // Обработка ошибок сервера
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

/*
 * Роут для создания новой статьи
 * POST /api/articles
 */
router.post('/', async (req, res) => {
  try {
    // Проверка существования всех указанных тегов
    const tags = await Tag.find({ _id: { $in: req.body.tags } });
    
    // Если количество найденных тегов не совпадает с запрошенным
    if (tags.length !== req.body.tags.length) {
      return res.status(400).json({
        success: false,
        error: 'Один или несколько тегов не существуют'
      });
    }
    
    // Создание новой статьи
    const article = await Article.create(req.body);
    
    // Отправка успешного ответа с созданной статьей
    res.status(201).json({
      success: true,
      data: article
    });
  } catch (err) {
    // Обработка ошибок валидации и других ошибок клиента
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/*
 * Роут для обновления статьи
 * PUT /api/articles/:id
 */
router.put('/:id', async (req, res) => {
  try {
    // Если в запросе есть обновление тегов
    if (req.body.tags) {
      // Проверяем существование новых тегов
      const tags = await Tag.find({ _id: { $in: req.body.tags } });
      
      // Если не все теги существуют
      if (tags.length !== req.body.tags.length) {
        return res.status(400).json({
          success: false,
          error: 'Один или несколько тегов не существуют'
        });
      }
    }
    
    // Поиск и обновление статьи
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Возвращать обновленный документ
      runValidators: true // Запускать валидаторы при обновлении
    });
    
    // Если статья не найдена
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    // Отправка обновленной статьи
    res.status(200).json({
      success: true,
      data: article
    });
  } catch (err) {
    // Обработка ошибок валидации и других ошибок клиента
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/*
 * Роут для удаления статьи
 * DELETE /api/articles/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    // Поиск и удаление статьи по ID
    const article = await Article.findByIdAndDelete(req.params.id);
    
    // Если статья не найдена
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    // Отправка успешного ответа
    res.status(200).json({
      success: true,
      data: {} // Пустой объект, так как статья удалена
    });
  } catch (err) {
    // Обработка ошибок сервера
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

/*
 * Роут для добавления рецензии к статье
 * POST /api/articles/:id/reviews
 */
router.post('/:id/reviews', async (req, res) => {
  try {
    // Поиск статьи по ID
    const article = await Article.findById(req.params.id);
    
    // Если статья не найдена
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    // Добавление новой рецензии в массив reviews
    article.reviews.push(req.body);
    // Сохранение статьи
    await article.save();
    
    // Отправка обновленного массива рецензий
    res.status(201).json({
      success: true,
      data: article.reviews
    });
  } catch (err) {
    // Обработка ошибок валидации и других ошибок клиента
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/*
 * Роут для получения рецензий статьи
 * GET /api/articles/:id/reviews
 */
router.get('/:id/reviews', async (req, res) => {
  try {
    // Поиск статьи по ID
    const article = await Article.findById(req.params.id);
    
    // Если статья не найдена
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Статья не найдена'
      });
    }
    
    // Отправка массива рецензий
    res.status(200).json({
      success: true,
      count: article.reviews.length, // Количество рецензий
      data: article.reviews // Массив рецензий
    });
  } catch (err) {
    // Обработка ошибок сервера
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

// Экспорт роутера для использования в основном файле приложения
module.exports = router;
