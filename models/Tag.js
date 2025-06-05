// Импортируем библиотеку Mongoose для работы с MongoDB
const mongoose = require('mongoose');

// Создаем схему для модели Tag (тегов) используя mongoose.Schema
const TagSchema = new mongoose.Schema({
  // Поле name - название тега
  name: {
    type: String, // Тип данных - строка
    required: [true, 'Пожалуйста, укажите название тега'], // Обязательное поле с кастомным сообщением об ошибке
    unique: true, // Значение должно быть уникальным в коллекции
    trim: true, // Автоматически удалять пробелы в начале и конце строки
    maxlength: [50, 'Название тега не может превышать 50 символов'] // Максимальная длина 50 символов
  },
  // Поле createdAt - дата создания тега
  createdAt: {
    type: Date, // Тип данных - дата
    default: Date.now // Значение по умолчанию - текущая дата и время
  }
});

// Экспортируем модель Tag, созданную на основе TagSchema
// Модель будет доступна в других файлах через mongoose.model('Tag')
module.exports = mongoose.model('Tag', TagSchema);
