
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import font from "./fonts/Roboto-Regular-normal.js"; // подключён как VFS

const PDFGenerator = (cartItems, userName, projectName, deliveryDate, returnDate) => {
  try {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      alert("Корзина пуста или данные некорректны");
      return;
    }

    const doc = new jsPDF();

    // 🔥 1. Добавление шрифта
    doc.addFileToVFS("Roboto-Regular.ttf", font);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");

    doc.setFontSize(16);
    doc.text("Позиции на отгрузку", 14, 20);

    const headers = [["ID", "Название", "Кол-во"]];
    const data = cartItems.map((item) => [
      String(item.id ?? ""),
      String(item.name ?? ""),
      String(item.quantity ?? "")
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 30,
    });

    const endY = doc.autoTable.previous.finalY || 40;

    doc.setFontSize(12);
    doc.text(`Заказал: ${userName || "-"}`, 14, endY + 10);
    doc.text(`Проект: ${projectName || "-"}`, 14, endY + 20);
    doc.text(`Срок: ${deliveryDate || "-"} — ${returnDate || "-"}`, 14, endY + 30);

    doc.save("order.pdf");
  } catch (error) {
    console.error("❌ Ошибка генерации PDF:", error);
    alert("Ошибка: не удалось сгенерировать PDF");
  }
};

export default PDFGenerator;
