import React, { useState, useEffect } from "react";
import ProductsList from "./components/ProductsList";
import CartView from "./components/CartView";
import Modal from "./components/Modal";

const App = () => {
  const [currentView, setCurrentView] = useState("catalog");
  const [userName, setUserName] = useState("");
  const [showModal, setShowModal] = useState(true);
  const [cart, setCart] = useState([]);
  const [filter, setFilter] = useState("");  // Фильтрация по категориям
  const [expandedCategories, setExpandedCategories] = useState({});  // Состояние для раскрытия категорий

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUserName(savedName);
      setShowModal(false);
    }
  }, []);

  const handleSaveName = (name) => {
    setUserName(name);
    localStorage.setItem("userName", name);
    setShowModal(false);
  };

  const handleUpdateInventory = async () => {
    try {
      for (let item of cart) {
        const response = await fetch('http://localhost:3000/updateInventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: item.id,
            orderedQuantity: item.quantity,
          }),
        });

        if (response.ok) {
          console.log('Остатки на складе обновлены');
        } else {
          console.error('Ошибка при обновлении остатков');
        }
      }
    } catch (error) {
      console.error('Ошибка при отправке запроса на сервер:', error);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories((prevState) => ({
      ...prevState,
      [category]: !prevState[category], // Переключаем состояние раскрытия
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {showModal && <Modal onSave={handleSaveName} />}
      {!showModal && (
        <>
          <header className="text-center py-6 text-3xl font-bold">
            {currentView === "catalog" ? "Склад" : "Корзина"}
          </header>
          {currentView === "catalog" ? (
            <ProductsList
              cart={cart}
              setCart={setCart}
              filter={filter}
              setFilter={setFilter}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
            />
          ) : (
            <CartView cart={cart} setCart={setCart} userName={userName} />
          )}
          <div className="fixed bottom-0 w-full bg-black text-center py-3 border-t border-white">
            {currentView === "catalog" ? (
              <button
                className="bg-white text-black font-semibold px-6 py-2 rounded-full"
                onClick={() => {
                  handleUpdateInventory();  // Обновление остатков перед переходом в корзину
                  setCurrentView("cart");
                }}
              >
                Перейти в корзину
              </button>
            ) : (
              <button
                className="bg-white text-black font-semibold px-6 py-2 rounded-full"
                onClick={() => setCurrentView("catalog")}
              >
                Назад к складу
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default App;
