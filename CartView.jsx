import React, { useState } from "react";
import PDFGenerator from "../utils/PDFGenerator";

const CartView = ({ cart, setCart, userName }) => {
  const [projectName, setProjectName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Увеличение количества с проверкой наличия на складе
  const increase = (id) => {
    const updated = cart.map((item) =>
      item.id === id && item.quantity < item.quantityAvailable
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    setCart(updated); // Обновляем состояние корзины
  };

  // Уменьшение количества
  const decrease = (id) => {
    const updated = cart.map((item) =>
      item.id === id && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1 }
        : item
    );
    setCart(updated); // Обновляем состояние корзины
  };

  // Удаление товара из корзины
  const remove = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated); // Убираем товар из корзины
  };

  // Отправка данных о заказе на сервер для обновления остатков на складе
  const updateInventory = async () => {
    try {
      // Для каждого товара в корзине отправляем запрос на обновление остатков
      for (let item of cart) {
        // Проверяем корректность данных quantityAvailable
        let available = Number(item.quantityAvailable);
        if (isNaN(available)) {
          console.warn(
            `Некорректное значение quantityAvailable для ID ${item.id}: ${item.quantityAvailable}`
          );
          available = Number(item.quantity); // Используем текущее количество как резервное значение
        }

        const newQuantity = available - item.quantity;

        // Проверяем корректность нового остатка
        if (isNaN(newQuantity) || newQuantity < 0) {
          console.error(
            `Ошибка при расчете нового остатка для ID ${item.id}. Данные:`,
            item
          );
          continue; // Пропускаем текущий товар
        }

        console.log(
          `Обновление товара с ID: ${item.id}, заказанное количество: ${item.quantity}`
        );
        console.log(`Новый остаток на складе: ${newQuantity}`);

        await fetch("http://localhost:3000/updateInventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: item.id, // ID товара
            orderedQuantity: item.quantity, // Заказанное количество
            newQuantity: newQuantity, // Новый рассчитанный остаток
          }),
        });
      }
      // После обновления остатков можно генерировать PDF
      alert("Остатки на складе обновлены! Теперь генерируем PDF.");
      PDFGenerator(cart, userName, projectName, deliveryDate, returnDate);
    } catch (error) {
      console.error("Ошибка при обновлении остатков:", error);
      alert("Ошибка при обновлении остатков. Пожалуйста, попробуйте снова.");
    }
  };

  // Экспорт в PDF
  const exportToPDF = () => {
    if (!Array.isArray(cart)) {
      alert("Ошибка: корзина не является массивом");
      return;
    }
    updateInventory(); // Вызываем функцию обновления остатков перед генерацией PDF
  };

  return (
    <div className="pb-28 px-4">
      {cart.map((item) => (
        <div
          key={item.id}
          className="bg-white text-black rounded-xl shadow p-4 mb-4 flex items-center"
        >
          <img
            src={item.imageURLs[0]}
            alt={item.name}
            className="w-16 h-16 object-cover rounded mr-4"
          />
          <div className="flex-1">
            <h3 className="font-bold text-lg">{item.name}</h3>
            <p className="text-sm text-gray-700 mb-2">Доступно: {item.quantityAvailable}</p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => decrease(item.id)}
                className="bg-black text-white rounded-full w-8 h-8"
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => increase(item.id)}
                className="bg-black text-white rounded-full w-8 h-8"
                disabled={item.quantity >= item.quantityAvailable} // Отключение кнопки "+" если достигнут лимит
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={() => remove(item.id)}
            className="text-red-600 font-bold text-xl ml-4"
          >
            ×
          </button>
        </div>
      ))}
      <input
        type="text"
        placeholder="Название проекта"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="w-full mb-2 px-4 py-2 rounded text-black"
      />
      <input
        type="date"
        placeholder="Дата отгрузки"
        value={deliveryDate}
        onChange={(e) => setDeliveryDate(e.target.value)}
        className="w-full mb-2 px-4 py-2 rounded text-black"
      />
      <input
        type="date"
        placeholder="Дата возврата"
        value={returnDate}
        onChange={(e) => setReturnDate(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded text-black"
      />
      <button
        onClick={exportToPDF} // Вызываем функцию обновления остатков и генерации PDF
        className="w-full bg-white text-black font-semibold px-6 py-3 rounded-full"
      >
        Экспортировать в PDF
      </button>
    </div>
  );
};

export default CartView;