const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const credentials = require('./credentials.json');  // Путь к файлу с ключом

const app = express();
const port = 3000;

// Разрешаем кросс-доменные запросы
app.use(cors());

// Настройка Google API с ключами из credentials.json
const auth = new google.auth.GoogleAuth({
  credentials,  // Здесь передаем файл с credentials
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],  // Права доступа
});

const sheets = google.sheets({ version: 'v4', auth });

// ID таблицы и диапазон, с которого забираем данные
const spreadsheetId = '17vAx26XcUJEJ8POW6zwJ-oUHGK0uoNF5PlYuXwFgdsU';  // Замените на ваш ID таблицы
const range = 'Sheet1!A2:F';  // Указываем диапазон, с которого забираем данные

// Маршрут для получения данных товаров
app.get('/products', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,  // ID таблицы
      range,           // Диапазон
    });

    const products = response.data.values.slice(1).map(row => ({
      id: parseInt(row[0]),             // ID товара
      name: row[1] || '',               // Название товара
      description: row[2] || '',        // Описание товара
      quantity: parseInt(row[3]) || 0,  // Количество товара
      imageURLs: row[4].split(',').map(url => url.trim()), // Список ссылок на изображения
      category: row[5] || ''            // Категория товара
    }));

    res.json(products);  // Отправляем данные клиенту
  } catch (error) {
    console.error('Ошибка получения данных из Google Sheets:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Запуск сервера на всех интерфейсах
app.listen(port, '0.0.0.0', () => {
  console.log(`Сервер запущен на http://0.0.0.0:${port}`);
});
