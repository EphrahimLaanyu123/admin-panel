import React, { useState, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie'; // Import the js-cookie library
import { ShoppingCart, Package, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'; // For icons

// Mock product data
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
  // State for navigation: 'products' or 'cart'
  const [currentPage, setCurrentPage] = useState('products');
  // State for showing a confirmation message
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
      Cookies.remove('shoppingCart'); // Clear corrupted cookie
    }
  }, []); // Run once on mount

  // UseEffect to save cart data to cookies whenever the cart state changes
  useEffect(() => {
    if (cart.length > 0) {
      // Stringify the cart array to store it as a JSON string in the cookie
      // The cookie will expire in 30 days
      Cookies.set('shoppingCart', JSON.stringify(cart), { expires: 30, secure: true, sameSite: 'Lax' });
    } else {
      // If the cart is empty, remove the cookie
      Cookies.remove('shoppingCart');
    }
  }, [cart]); // Run whenever the cart state changes

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
    setShowConfirmation(`${productToAdd.name} added to cart!`);
    const timer = setTimeout(() => setShowConfirmation(''), 2000);
    return () => clearTimeout(timer);
  };

  // Function to update item quantity in cart
  const updateQuantity = (productId, change) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + change } : item
      );
      // Remove items with quantity 0 or less
      return updatedCart.filter((item) => item.quantity > 0);
    });
  };

  // Function to remove an item from the cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  // Calculate total items in cart (for badge)
  const totalCartItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  // Calculate total price of items in cart
  const totalCartPrice = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  return (
    // Main container with Tailwind CSS for styling and responsiveness
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-inter">
      {/* Header */}
      <header className="w-full max-w-5xl bg-white shadow-md rounded-xl p-4 flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700 tracking-tight">
          My Awesome Store
        </h1>
        <nav className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage('products')}
            className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ease-in-out ${currentPage === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-200'}`}
          >
            <Package className="inline-block mr-2" size={20} /> Products
          </button>
          <button
            onClick={() => setCurrentPage('cart')}
            className={`px-4 py-2 rounded-lg font-semibold relative transition duration-200 ease-in-out ${currentPage === 'cart' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-200'}`}
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

      {/* Confirmation message */}
      {showConfirmation && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce-in z-50">
          {showConfirmation}
        </div>
      )}

      {/* Conditional rendering for Products Page */}
      {currentPage === 'products' && (
        <main className="w-full max-w-5xl bg-white p-8 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white p-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/200x200/CCCCCC/333333?text=Image+Not+Found`; }}
                />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Conditional rendering for Cart Page */}
      {currentPage === 'cart' && (
        <main className="w-full max-w-3xl bg-white p-8 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Shopping Cart</h2>
          {cart.length === 0 ? (
            <p className="text-gray-600 text-center text-lg">Your cart is empty. Start shopping!</p>
          ) : (
            <>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <img
                        src={products.find(p => p.id === item.productId)?.imageUrl || `https://placehold.co/80x80/CCCCCC/333333?text=Item`}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg mr-4"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/80x80/CCCCCC/333333?text=Item`; }}
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-gray-600">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-2 text-gray-700 hover:bg-gray-200 rounded-l-lg"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <span className="px-3 font-semibold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-2 text-gray-700 hover:bg-gray-200 rounded-r-lg"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-800">Total:</span>
                <span className="text-3xl font-extrabold text-blue-700">${totalCartPrice.toFixed(2)}</span>
              </div>
              <button
                onClick={() => alert('Proceeding to Checkout! (Functionality not implemented)')} // Replace with actual checkout logic
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
              >
                Proceed to Checkout
              </button>
              <button
                onClick={() => setCurrentPage('products')}
                className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75"
              >
                Continue Shopping
              </button>
            </>
          )}
        </main>
      )}

      {/* Footer / Info about cookie storage */}
      <footer className="mt-8 text-gray-500 text-sm text-center">
        <p>Your shopping cart data is saved in your browser's cookies.</p>
        <p>This ensures your cart persists across sessions for up to 30 days.</p>
        <p className="mt-2 text-xs">
          **Note:** This is a client-side only demonstration. For a real e-commerce store,
          cart data should also be stored securely on a server, especially for authenticated users.
        </p>
      </footer>

      {/* Tailwind CSS keyframe for bounce-in effect */}
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
  );
}

export default App;
