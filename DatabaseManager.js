
// DatabaseManager.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'Inventory.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка при открытии базы данных:', err.message);
  } else {
    console.log('Подключение к базе данных SQLite установлено.');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    imageURLs TEXT,
    category TEXT NOT NULL
  )`);

  db.get('SELECT COUNT(*) AS count FROM Products', (err, row) => {
    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO Products (name, description, quantity, imageURLs, category) VALUES (?, ?, ?, ?, ?)`);
      stmt.run("Диван", "Мягкая мебель для сидения нескольких человек, часто используется в гостиных.", 10, "https://example.com/images/sofa1.jpg,https://example.com/images/sofa2.jpg", "Мебель");
      stmt.run("Кровать", "Предназначена для сна и отдыха, бывает односпальной, двуспальной или детской.", 15, "https://example.com/images/bed1.jpg,https://example.com/images/bed2.jpg", "Мебель");
      stmt.run("Шкаф", "Корпусная мебель для хранения одежды и других предметов, может быть распашным или купе.", 5, "https://example.com/images/wardrobe1.jpg,https://example.com/images/wardrobe2.jpg", "Мебель");
      stmt.run("Стол обеденный", "Используется для приема пищи, обычно размещается на кухне или в столовой.", 8, "https://example.com/images/dining_table1.jpg,https://example.com/images/dining_table2.jpg", "Столы");
      stmt.run("Стул", "Предмет мебели для сидения одного человека, часто сопровождает обеденный стол.", 20, "https://example.com/images/chair1.jpg,https://example.com/images/chair2.jpg", "Стулья");
      stmt.finalize();
    }
  });
});

const fetchProducts = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Products', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const products = rows.map(row => ({
          id: row.id,
          name: row.name,
          description: row.description,
          quantity: row.quantity,
          imageURLs: row.imageURLs.split(','),
          category: row.category
        }));
        resolve(products);
      }
    });
  });
};

module.exports = { fetchProducts };
