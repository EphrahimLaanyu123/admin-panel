// App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { ShoppingCart, Package } from 'lucide-react';
import Products from './components/Products';
import Cart from './components/Cart';
// Make sure Products.productList is accessible, or fetch products in App.jsx and pass down
// For demonstration, we'll assume Products.productList is available as before.


function App() {
  const [cart, setCart] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Load cart from cookies on initial mount
  useEffect(() => {
    try {
      const storedCart = Cookies.get('shoppingCart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('Failed to load cart from cookies:', error);
      Cookies.remove('shoppingCart'); // Clear corrupted cookie
    }
  }, []);

  // Save cart to cookies whenever cart state changes
  useEffect(() => {
    if (cart.length > 0) {
      Cookies.set('shoppingCart', JSON.stringify(cart), {
        expires: 30, // 30 days
        secure: process.env.NODE_ENV === 'production', // Use secure in production
        sameSite: 'Lax',
      });
    } else {
      Cookies.remove('shoppingCart'); // Remove cookie if cart is empty
    }
  }, [cart]);

  // New useEffect to handle post-payment cart clearing based on backend verification
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pesapalTrackingId = params.get('pesapal_transaction_tracking_id');
    const pesapalResponseData = params.get('pesapal_response_data'); // This might contain status, but verify with backend

    const verifyAndClearCart = async (trackingId) => {
      setShowConfirmation('Verifying payment status...');
      try {
        const response = await fetch('http://localhost:5000/verify_pesapal_payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tracking_id: trackingId }),
        });

        const data = await response.json();

        if (response.ok) {
          // Payment confirmed by backend
          console.log('Backend confirmed payment success:', data);
          setCart([]); // Clear cart state
          Cookies.remove('shoppingCart'); // Remove cart cookie
          setShowConfirmation('Payment successful! Your cart has been cleared.');
        } else {
          // Payment not confirmed or failed
          console.error('Backend reported payment issue:', data.error || 'Unknown error');
          setShowConfirmation(`Payment verification failed: ${data.error || 'Please check your transaction status.'}`);
        }
      } catch (error) {
        console.error('Error during payment verification call:', error);
        setShowConfirmation('An error occurred during payment verification. Please contact support.');
      } finally {
        // Clear the confirmation message after a delay, and potentially redirect
        const timer = setTimeout(() => {
          setShowConfirmation('');
          // Optional: Redirect to a "thank you" page or products page
          // Use replace to avoid going back to the /cart?pesapal... URL in history
          navigate('/', { replace: true });
        }, 4000); // Give user time to read the message
        return () => clearTimeout(timer);
      }
    };

    // If Pesapal redirect parameters are present and cart is not already empty
    // (This prevents re-clearing if user navigates back to /cart?pesapal... after it's cleared)
    if (pesapalTrackingId && cart.length > 0) {
      // It's crucial to clear these parameters from the URL after processing
      // This is often done by a redirect.
      // However, for robustness, we can immediately call the verification.
      verifyAndClearCart(pesapalTrackingId);
    }
  }, [location.search, navigate, setCart, cart.length]); // Depend on location.search and cart.length

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
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg font-semibold relative transition duration-200 ease-in-out ${
                isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 hover:bg-gray-200'
              }`
            }
          >
            <ShoppingCart className="inline-block mr-2" size={20} /> Cart
            {totalCartItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </NavLink>
        </nav>
      </header>

      {showConfirmation && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50">
          {showConfirmation}
        </div>
      )}

      <Routes>
        <Route path="/" element={<Products addToCart={addToCart} />} />
        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              products={Products.productList} // Ensure Products.productList is defined and accessible
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
            />
          }
        />
        {/* The payment-success route will likely be temporary as App.jsx handles the redirect */}
        <Route path="/payment-success" element={
          <div className="text-center text-green-700 font-bold text-2xl p-10 bg-white rounded-xl shadow-lg">
            Processing payment... Please wait.
          </div>
        }/>
      </Routes>
    </div>
  );
}

export default App;