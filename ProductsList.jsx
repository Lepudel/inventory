import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductsList = ({ cart, setCart, filter, setFilter, expandedCategories, toggleCategory }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [tempQuantities, setTempQuantities] = useState({});
  const [categories, setCategories] = useState({});
  const [descriptions, setDescriptions] = useState({}); // Для хранения описаний из Google Sheets
  const [isMenuOpen, setMenuOpen] = useState(false); // Состояние для мобильного меню

  // Получаем товары с сервера
  useEffect(() => {
    axios.get("http://localhost:3000/products").then((res) => {
      if (res.data && res.data.length > 0) {
        setProducts(res.data);

        // Генерация категорий и подкатегорий
        const categoryMap = {};

        res.data.forEach((product) => {
          const categoryParts = product.category.split("/").map((part) => part.trim());

          let currentLevel = categoryMap;
          categoryParts.forEach((part, index) => {
            if (!currentLevel[part]) {
              currentLevel[part] = index === categoryParts.length - 1 ? [] : {};
            }
            currentLevel = currentLevel[part];
          });
        });

        setCategories(categoryMap);
      }
    });

    // Загружаем описания из Google Sheets
    const fetchDescriptions = async () => {
      try {
        const response = await axios.get(
          `https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{RANGE}?key={API_KEY}`
        );
        const rows = response.data.values;

        const descriptionsMap = {};
        rows.forEach((row) => {
          const [productId, description] = row;
          descriptionsMap[productId] = description;
        });

        setDescriptions(descriptionsMap);
      } catch (error) {
        console.error("Ошибка при загрузке данных из Google Sheets:", error);
      }
    };

    fetchDescriptions();
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
      if (filter) {
        const categoryParts = p.category.split("/").map((part) => part.trim().toLowerCase());
        return categoryParts.join("/").startsWith(filter.toLowerCase());
      }
      return true;
    })
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  // Рекурсивная функция для отображения категорий и подкатегорий
  const renderCategories = (categories, path = "", level = 0) => {
    return Object.keys(categories).map((category) => {
      const newPath = path ? `${path}/${category}` : category;
      const isExpanded = expandedCategories[newPath];

      return (
        <div
          key={newPath}
          className="flex flex-col"
          style={{ paddingLeft: `${level * 10}px` }} // Сдвиг подпунктов вправо
        >
          <button
            onClick={() => {
              toggleCategory(newPath);
              setFilter(filter === newPath ? "" : newPath);
            }}
            className={`px-3 py-1 border rounded mb-2 category-button ${
              filter === newPath ? "selected" : ""
            } ${level > 0 ? "subcategory-button" : ""}`}
          >
            {category}
          </button>
          {isExpanded && renderCategories(categories[category], newPath, level + 1)}
        </div>
      );
    });
  };

  // Генерация хлебных крошек
  const renderBreadcrumbs = () => {
    if (!filter) return null;

    const parts = filter.split("/");
    return (
      <div className="breadcrumbs">
        {parts.map((part, index) => {
          const path = parts.slice(0, index + 1).join("/");
          return (
            <span key={path} className="breadcrumb">
              <button
                onClick={() => setFilter(path)}
                className="breadcrumb-button"
              >
                {part}
              </button>
              {index < parts.length - 1 && " / "}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex">
      {/* Боковая панель с категориями */}
      <div className="category-container hidden md:block">
        {renderCategories(categories)}
      </div>

      {/* Основное содержимое */}
      <div className="content-container flex-1 pb-28 px-4">
        {/* Поиск по товарам */}
        <input
          type="text"
          placeholder="Поиск"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded text-black"
        />

        {/* Хлебные крошки */}
        {renderBreadcrumbs()}

        {/* Отображение отфильтрованных товаров */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.length > 0 ? (
            filtered.map((product) => (
              <div key={product.id} className="card">
                <img
                  src={product.imageURLs[0]}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1 text-center">
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {descriptions[product.id]?.slice(0, 100) || "Описание отсутствует..."}
                  </p>
                  <p className="text-sm text-gray-700">На складе: {product.quantity}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
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
                <button
                  onClick={() => addToCart(product)}
                  className="mt-3 bg-black text-white w-full py-2 rounded-full"
                >
                  Добавить в корзину
                </button>
              </div>
            ))
          ) : (
            <div className="text-center text-white col-span-full">
              Нет товаров для отображения по выбранному фильтру
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsList;