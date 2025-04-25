
// Cart.js
export default class Cart {
  constructor() {
    this.items = [];
  }

  addItem(product) {
    this.items.push(product);
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
  }

  updateQuantity(productId, quantity) {
    const product = this.items.find(item => item.id === productId);
    if (product) {
      product.quantity = quantity;
    }
  }
}
