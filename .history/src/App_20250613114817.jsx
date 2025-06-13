// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Cookies from 'js-cookie'; // Import the js-cookie library

// Import components and pages with explicit .jsx extensions
import Header from './components/Header.jsx';
import ConfirmationMessage from './components/ConfirmationMessage.jsx';
import Footer from './components/Footer.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import CartPage from './pages/CartPage.jsx';

// Mock product data (moved to a separate file for larger projects)
// For simplicity in this example, keeping it here. In a real app, import from 'products.js'
const products = [
  { id: '1', name: 'Wireless Headphones', price: 99.99, imageUrl: 'https://placehold.co/200x200/CAF0F8/03045E?text=Headphones', description: 'Experience immersive sound with these comfortable wireless headphones.' },
  { id: '2', name: 'Smartwatch', price: 199.99, imageUrl: 'https://placehold.co/200x200/ADE8F4/03045E?text=Smartwatch', description: 'Track your fitness and stay connected with this sleek smartwatch.' },
  { id: '3', name: 'Portable Bluetooth Speaker', price: 49.99, imageUrl: 'https://placehold.co/200x200/90E0EF/03045E?text=Speaker', description: 'Powerful sound in a compact design, perfect for on-the-go.' },
  { id: '4', name: 'Laptop Stand', price: 29.99, imageUrl: 'https://placehold.co/200x200/48CAE4/03045E?text=Stand', description: 'Ergonomic design to elevate your laptop for better posture.' },
  { id: '5', name: 'External SSD 1TB', price: 119.99, imageUrl: 'https://placehold.co/200x200/00B4D8/03045E?text=SSD', description: 'Fast and reliable storage for all your files and backups.' },
];


// Main App component
function App() {
  // State for the shopping cart: an array of { productId, name, price, quantity }
  const [cart, setCart] = useState([]);
  // State for showing a confirmation message (e.g., "Item added to cart!")
  const [showConfirmation, setShowConfirmation] = useState('');

  // UseEffect to load cart data from cookies when the component mounts
  useEffect(() => {
    try {
      const storedCart = Cookies.get('shoppingCart');
      if (storedCart) {
        // Parse the JSON string back into an array
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Failed to load cart from cookies:', error);
      Cookies.remove('shoppingCart'); // Clear corrupted cookie to prevent future errors
    }
  }, []); // Run once on mount

  // UseEffect to save cart data to cookies whenever the cart state changes
  useEffect(() => {
    if (cart.length > 0) {
      // Stringify the cart array to store it as a JSON string in the cookie
      // The cookie will expire in 30 days
      Cookies.set('shoppingCart', JSON.stringify(cart), { expires: 30, secure: true, sameSite: 'Lax' });
    } else {
      // If the cart is empty, remove the cookie to save space
      Cookies.remove('shoppingCart');
    }
  }, [cart]); // Dependency array: runs whenever `cart` state changes

  // Function to add a product to the cart
  const addToCart = (productToAdd) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === productToAdd.id);
      if (existingItem) {
        // If item already in cart, increment quantity
        return prevCart.map((item) =>
          item.productId === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // If item not in cart, add new item with quantity 1
        return [...prevCart, { productId: productToAdd.id, name: productToAdd.name, price: productToAdd.price, quantity: 1 }];
      }
    });
    // Show confirmation message and hide it after 2 seconds
    setShowConfirmation(`${productToAdd.name} added to cart!`);
    const timer = setTimeout(() => setShowConfirmation(''), 2000);
    return () => clearTimeout(timer); // Cleanup timer on unmount or re-render
  };

  // Function to update item quantity in cart
  const updateQuantity = (productId, change) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + change } : item
      );
      // Filter out items with quantity 0 or less
      return updatedCart.filter((item) => item.quantity > 0);
    });
  };

  // Function to remove an item completely from the cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  // Calculate total items in cart (for badge in Header)
  const totalCartItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  // Calculate total price of all items in cart
  const totalCartPrice = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  return (
    // Main container for the entire application
    <Router> {/* BrowserRouter wraps the entire application for routing */}
      <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
        {/* Header component, always visible */}
        <Header totalCartItems={totalCartItems} />

        {/* Confirmation message, conditionally rendered */}
        <ConfirmationMessage message={showConfirmation} />

        {/* Main content area defined by Routes */}
        <Routes>
          {/* Route for the Products page (default) */}
          <Route path="/" element={<ProductsPage products={products} addToCart={addToCart} />} />
          {/* Route for the Cart page */}
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                products={products} // Pass products to get image URLs etc.
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                totalCartPrice={totalCartPrice}
              />
            }
          />
        </Routes>

        {/* Footer component, always visible */}
        <Footer />

        {/* Tailwind CSS keyframe for bounce-in effect (can be moved to global CSS) */}
        <style jsx>{`
          @keyframes bounce-in {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); }
          }
          .animate-bounce-in {
            animation: bounce-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
          }
        `}</style>
      </div>
    </Router>
  );
}

export default App;
