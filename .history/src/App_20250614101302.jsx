import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { ShoppingCart, Package } from 'lucide-react';


import ProductsComponent from './components/Products.jsx'; 
import productList from './components/ProductsData.jsx'; 
import Cart from './components/Cart.jsx';
import Billing from './components/Billing.jsx';
import PaymentSuccess from './components/PaymentSuccess.jsx'; 

function App() {
  const [cart, setCart] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState('');
  const location = useLocation();

  // Initialize the 'products' state from the imported 'productList' array.
  // This 'products' state will be passed down to child components.
  const [products] = useState(productList); 

  // Effect to load cart data from cookies when the component mounts
  useEffect(() => {
    try {
      const storedCart = Cookies.get('shoppingCart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Failed to load cart from cookies:', error);
      // If parsing fails (e.g., corrupted cookie), remove it
      Cookies.remove('shoppingCart');
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to save cart data to cookies whenever the 'cart' state changes
  useEffect(() => {
    if (cart.length > 0) {
      Cookies.set('shoppingCart', JSON.stringify(cart), {
        expires: 30, // Cookie expires in 30 days
        secure: true, // Only send cookie over HTTPS (important for production)
        sameSite: 'Lax', // Protection against Cross-Site Request Forgery (CSRF)
      });
    } else {
      // If the cart is empty, remove the cookie
      Cookies.remove('shoppingCart');
    }
  }, [cart]); // Re-run this effect whenever 'cart' state changes

  /**
   * Adds a product to the cart or increments its quantity if already present.
   * @param {object} productToAdd - The product object to add to the cart.
   */
  const addToCart = (productToAdd) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === productToAdd.id);
      if (existingItem) {
        // If the product already exists in the cart, increment its quantity
        return prevCart.map((item) =>
          item.productId === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // If the product is new to the cart, add it with a quantity of 1
        return [...prevCart, { productId: productToAdd.id, name: productToAdd.name, price: productToAdd.price, quantity: 1 }];
      }
    });

    // Display a confirmation message for a short period
    setShowConfirmation(`${productToAdd.name} added to cart!`);
    const timer = setTimeout(() => setShowConfirmation(''), 2000);
    // Cleanup function for the timer to prevent memory leaks if component unmounts
    return () => clearTimeout(timer); 
  };

  /**
   * Updates the quantity of a specific product in the cart.
   * @param {string} productId - The ID of the product to update.
   * @param {number} change - The amount to change the quantity by (e.g., +1 or -1).
   */
  const updateQuantity = (productId, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + change } : item
        )
        // Filter out items whose quantity drops to 0 or below
        .filter((item) => item.quantity > 0)
    );
  };

  /**
   * Removes a product entirely from the cart.
   * @param {string} productId - The ID of the product to remove.
   */
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  // Memoize the total number of items in the cart for performance
  const totalCartItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
      {/* Header section with store title and navigation links */}
      <header className="w-full max-w-5xl bg-white shadow-md rounded-xl p-4 flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">My Store</h1>
        <nav className="flex items-center space-x-4">
          {/* Navigation link to the products page */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold transition duration-200 ease-in-out ${
                isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            <Package className="inline-block mr-2" size={20} /> Products
          </NavLink>
          {/* Navigation link to the cart page */}
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold relative transition duration-200 ease-in-out ${
                isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            <ShoppingCart className="inline-block mr-2" size={20} /> Cart
            {/* Display total number of items in cart if greater than 0 */}
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </NavLink>
        </nav>
      </header>

      {/* Confirmation message displayed when an item is added to cart */}
      {showConfirmation && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50">
          {showConfirmation}
        </div>
      )}

      {/* Define application routes */}
      <Routes>
        {/* Route for the Products page. Pass 'products' data and 'addToCart' function */}
        <Route path="/" element={<ProductsComponent products={products} addToCart={addToCart} />} />
        {/* Route for the Cart page. Pass cart data and quantity/remove functions */}
        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              products={products} // Correctly passing the 'products' state
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
            />
          }
        />
        {/* Route for the Billing page. Pass cart data and products data */}
        <Route
            path="/billing"
            element={
              <Billing
                cart={cart}
                products={products} // Correctly passing the 'products' state
              />
            }
          />
        {/* Route for the Payment Success page */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
      </Routes>
    </div>
  );
}

export default App;
