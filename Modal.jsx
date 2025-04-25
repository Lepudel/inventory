
import React, { useState } from "react";
import logo from "../assets/logo.png"; // изображение логотипа

const Modal = ({ onSave }) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 px-4">
      <img src={logo} alt="Logo" className="w-48 mb-6" />
      <h2 className="text-white text-xl mb-4">Введите ваше имя</h2>
      <input
        type="text"
        placeholder="Имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-4 py-2 rounded w-full max-w-xs text-black mb-4"
      />
      <button
        onClick={handleSubmit}
        className="bg-white text-black px-6 py-2 rounded-full font-semibold"
      >
        Сохранить
      </button>
    </div>
  );
};

export default Modal;
