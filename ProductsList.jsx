import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductsList = ({ cart, setCart, filter, setFilter, expandedCategories, toggleCategory }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [tempQuantities, setTempQuantities] = useState({});
  const [categories, setCategories] = useState({});

  // Получаем товары с сервера
  useEffect(() => {
    axios.get("http://localhost:3000/products").then((res) => {
      if (res.data && res.data.length > 0) {
        setProducts(res.data);

        // Генерация категорий и подкатегорий
        const categoryMap = {};

        res.data.forEach((product) => {
          const categoryParts = product.category.split('/').map((part) => part.trim()); // Разделяем по "/"

          let currentLevel = categoryMap;
          categoryParts.forEach((part, index) => {
            if (!currentLevel[part]) {
              currentLevel[part] = index === categoryParts.length - 1 ? [] : {}; // Если это последний элемент, добавляем пустой массив для подкатегорий
            }
            currentLevel = currentLevel[part]; // Переходим к следующему уровню
          });
        });

        setCategories(categoryMap);  // Обновляем категориальную структуру
      }
    });
  }, []);

  const increase = (id, maxQty) => {
    setTempQuantities((prev) => {
      const newQty = (prev[id] || 0) + 1;
      return { ...prev, [id]: newQty > maxQty ? maxQty : newQty };
    });
  };

  const decrease = (id) => {
    setTempQuantities((prev) => {
      const newQty = (prev[id] || 0) - 1;
      return { ...prev, [id]: newQty < 0 ? 0 : newQty };
    });
  };

  const addToCart = (product) => {
    const addQty = tempQuantities[product.id] || 0;
    if (addQty === 0) return;

    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      const updated = cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity:
                item.quantity + addQty > product.quantity
                  ? product.quantity
                  : item.quantity + addQty,
            }
          : item
      );
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: addQty > product.quantity ? product.quantity : addQty,
        },
      ]);
    }

    setTempQuantities((prev) => ({ ...prev, [product.id]: 0 }));
  };

  // Фильтрация товаров по категориям
  const filtered = products
    .filter((p) => {
      // Фильтрация товаров по категориям (если filter не пустой)
      if (filter) {
        const categoryParts = p.category.split('/').map(part => part.trim().toLowerCase());
        return categoryParts.join('/').startsWith(filter.toLowerCase());
      }
      return true; // Если фильтра нет, показываем все товары
    })
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase())); // Фильтрация по названию товара

  console.log("Отфильтрованные товары: ", filtered);

  // Рекурсивная функция для отображения категорий и подкатегорий
  const renderCategories = (categories, path = "") => {
    return Object.keys(categories).map((category) => {
      const newPath = path ? `${path}/${category}` : category;
      const isExpanded = expandedCategories[newPath];

      return (
        <div key={newPath} className="flex flex-col">
          {/* Основная категория */}
          <button
            onClick={() => {
              toggleCategory(newPath);
              setFilter(newPath); // Устанавливаем фильтр на выбранную категорию
            }}
            className="px-3 py-1 border rounded mb-2 category-button"
          >
            {category}
          </button>

          {/* Подкатегории */}
          {isExpanded && renderCategories(categories[category], newPath)}
        </div>
      );
    });
  };

  return (
    <div className="pb-28 px-4">
      {/* Поиск по товарам */}
      <input
        type="text"
        placeholder="Поиск"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded text-black"
      />

      {/* Категории и подкатегории в виде меню с возможностью раскрытия */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilter("")} className="px-3 py-1 border rounded">
          Все
        </button>

        {renderCategories(categories)}  {/* Вставка категорий и подкатегорий */}
      </div>

      {/* Отображение отфильтрованных товаров */}
      {filtered.length > 0 ? (
        filtered.map((product) => (
          <div key={product.id} className="bg-white text-black rounded-xl shadow p-4 mb-4">
            <div className="flex items-center">
              <img
                src={product.imageURLs[0]}
                alt={product.name}
                className="w-24 h-24 object-cover rounded mr-4"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-sm text-gray-700">На складе: {product.quantity}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => decrease(product.id)}
                    className="bg-black text-white rounded-full w-8 h-8"
                  >
                    −
                  </button>
                  <span>{tempQuantities[product.id] || 0}</span>
                  <button
                    onClick={() => increase(product.id, product.quantity)}
                    className="bg-black text-white rounded-full w-8 h-8"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => addToCart(product)}
              className="mt-3 bg-black text-white w-full py-2 rounded-full"
            >
              Добавить в корзину
            </button>
          </div>
        ))
      ) : (
        <div className="text-center text-white">Нет товаров для отображения по выбранному фильтру</div>
      )}
    </div>
  );
};

export default ProductsList;