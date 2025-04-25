const express = require('express');
const { google } = require('googleapis');
const credentials = require('./credentials.json');  // Путь к файлу с ключом
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware для обработки JSON в запросах
app.use(cors());
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  credentials,  // Передаем файл с credentials
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],  // Права для записи в таблицу
});

const sheets = google.sheets({ version: 'v4', auth });

const spreadsheetId = '17vAx26XcUJEJ8POW6zwJ-oUHGK0uoNF5PlYuXwFgdsU';  // ID таблицы
const range = 'Sheet1!A2:H';  // Диапазон данных (например, строки с товарами)

// Получение данных из Google Sheets
app.get('/products', async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const products = response.data.values.slice(1).map(row => {
      const id = parseInt(row[0]);
      const name = row[1] || '';
      const description = row[2] || '';
      const quantity = parseInt(row[3]) || 0;

      // Проверка на undefined для ImageURLs и использование пустой строки если значение отсутствует
      const imageURLsRaw = row[4] || '';  
      const imageURLs = imageURLsRaw ? imageURLsRaw.split(',').map(url => url.trim()).filter(url => url !== '') : [];

      const category = row[5] || '';
      const quantityAvailable = parseInt(row[7]) || parseInt(row[3]);  // Используем количество из D, если H пустое

      return { id, name, description, quantity, imageURLs, category, quantityAvailable };
    });

    res.json(products);  // Отправляем данные на фронтенд
  } catch (error) {
    console.error('Ошибка получения данных из Google Sheets:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Обновление данных о товаре (например, остатки на складе)
app.post('/updateInventory', async (req, res) => {
  const { id, orderedQuantity } = req.body;  // Получаем ID товара и количество заказанное пользователем
  console.log(`Запрос на обновление товара с ID: ${id}, заказанное количество: ${orderedQuantity}`);

  // Находим строку товара в таблице по ID
  const productRange = `Sheet1!D${id + 1}:H${id + 1}`;  // Строка товара (например, D2:H2 для ID = 1)
  console.log(`Диапазон для обновления: ${productRange}`);

  try {
    // Получаем текущее количество товара и остаток на складе
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: productRange,
    });

    const productData = response.data.values[0];  // Данные товара
    console.log(`Данные товара из таблицы: ${productData}`);

    const totalQuantity = parseInt(productData[3]);  // Общее количество (столбец D)
    let currentAvailableQuantity = productData[7];  // Остаток на складе (столбец H)

    // Логирование текущих значений
    console.log(`Текущее количество из столбца H (остаток): ${currentAvailableQuantity}`);

    // Если значение в столбце H пустое или некорректное, используем количество из D
    if (!currentAvailableQuantity || isNaN(parseInt(currentAvailableQuantity))) {
      console.log(`Остаток пустой или некорректный, используем количество из столбца D`);
      currentAvailableQuantity = totalQuantity;  // Используем количество из D
    } else {
      currentAvailableQuantity = parseInt(currentAvailableQuantity);  // Преобразуем остаток в число
    }

    // Новый остаток на складе после оформления заказа
    const newAvailableQuantity = currentAvailableQuantity - orderedQuantity;
    console.log(`Новый остаток на складе: ${newAvailableQuantity}`);

    // Если остаток больше или равен 0, обновляем таблицу
    if (newAvailableQuantity >= 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!H${id + 1}`,  // Столбец H для обновления
        valueInputOption: 'RAW',
        requestBody: {
          values: [[newAvailableQuantity]], // Обновляем остаток на складе
        },
      });

      res.send('Остатки на складе обновлены успешно!');
    } else {
      res.status(400).send('Ошибка: недостаточно товара на складе!');
    }
  } catch (error) {
    console.error('Ошибка при обновлении остатков:', error);
    res.status(500).send('Ошибка сервера при обновлении остатков');
  }
});

// Слушаем на всех интерфейсах
app.listen(port, '0.0.0.0', () => {
  console.log(`Сервер запущен на http://0.0.0.0:${port}`);
});
