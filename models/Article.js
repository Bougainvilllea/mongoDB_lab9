// Импорт необходимых модулей
const mongoose = require('mongoose'); // Импорт библиотеки Mongoose для работы с MongoDB
const Review = require('./Review'); // Импорт модели Review (отзывы)
const Tag = require('./Tag'); // Импорт модели Tag (теги)

// Создание схемы статьи (ArticleSchema) с помощью mongoose.Schema
const ArticleSchema = new mongoose.Schema({
  title: {
    type: String, // Поле title должно быть строкой
    required: [true, 'Пожалуйста, добавьте название статьи'], // Обязательное поле с сообщением об ошибке
    trim: true, // Автоматическое удаление пробелов в начале и конце строки
    maxlength: [200, 'Название статьи не может превышать 200 символов'] // Максимальная длина 200 символов
  },
  authors: {
    type: [String], // Массив строк (список авторов)
    required: [true, 'Пожалуйста, укажите авторов'] // Обязательное поле
  },
  publishDate: {
    type: Date, // Поле должно быть датой
    default: Date.now // Значение по умолчанию - текущая дата и время
  },
  content: {
    type: String, // Поле должно быть строкой (содержание статьи)
    required: [true, 'Пожалуйста, добавьте содержание статьи'] // Обязательное поле
  },
  tags: {
    type: [mongoose.Schema.Types.ObjectId], // Массив ObjectId (ссылки на документы Tag)
    ref: 'Tag', // Связь с моделью Tag
    required: true // Обязательное поле
  },
  reviews: [Review.schema], // Массив отзывов, использующих схему Review
  averageRating: {
    type: Number, // Поле должно быть числом (средний рейтинг)
    min: [1, 'Рейтинг должен быть не менее 1'], // Минимальное значение 1
    max: [10, 'Рейтинг должен быть не более 10'] // Максимальное значение 10
  }
});

// Middleware (пред-сохранение) - выполняется перед сохранением документа
ArticleSchema.pre('save', function(next) {
  // Проверяем, есть ли отзывы и не пустой ли массив reviews
  if (this.reviews && this.reviews.length > 0) {
    // Считаем сумму всех рейтингов отзывов
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    // Рассчитываем средний рейтинг
    this.averageRating = sum / this.reviews.length;
  } else {
    // Если отзывов нет, устанавливаем средний рейтинг в 0
    this.averageRating = 0;
  }
  next(); // Передаем управление следующему middleware
});

// Экспорт модели Article, созданной на основе ArticleSchema
module.exports = mongoose.model('Article', ArticleSchema);
});

module.exports = mongoose.model('Article', ArticleSchema);
