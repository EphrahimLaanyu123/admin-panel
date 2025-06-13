// App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie';
import { ShoppingCart, Package } from 'lucide-react';
import Products from './Products';
import Cart from './components/Cart';

function App() {
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState('products');
  const [showConfirmation, setShowConfirmation] = useState('');

  useEffect(() => {
    try {
      const storedCart = Cookies.get('shoppingCart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Failed to load cart from cookies:', error);
      Cookies.remove('shoppingCart');
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      Cookies.set('shoppingCart', JSON.stringify(cart), {
        expires: 30,
        secure: true,
        sameSite: 'Lax',
      });
    } else {
      Cookies.remove('shoppingCart');
    }
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
      }
    });
    setShowConfirmation(`${product.name} added to cart!`);
    const timer = setTimeout(() => setShowConfirmation(''), 2000);
    return () => clearTimeout(timer);
  };

  const updateQuantity = (productId, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + change } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const totalCartItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
      <header className="w-full max-w-5xl bg-white shadow-md rounded-xl p-4 flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">My Awesome Store</h1>
        <nav className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage('products')}
            className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ease-in-out ${
              currentPage === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package className="inline-block mr-2" size={20} /> Products
          </button>
          <button
            onClick={() => setCurrentPage('cart')}
            className={`px-4 py-2 rounded-lg font-semibold relative transition duration-200 ease-in-out ${
              currentPage === 'cart' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ShoppingCart className="inline-block mr-2" size={20} /> Cart
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </button>
        </nav>
      </header>

      {showConfirmation && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50">
          {showConfirmation}
        </div>
      )}

      {currentPage === 'products' && <Products addToCart={addToCart} />}
      {currentPage === 'cart' && (
        <Cart cart={cart} products={Products.productList} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
      )}
    </div>
  );
}

export default App;
