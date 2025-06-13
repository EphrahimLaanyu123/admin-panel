import React, { useState, useEffect } from 'react';
import Cart from './components/Cart';
import { Trash2 } from 'lucide-react'; // Needed for Cart.jsx if moved

function App() {
  // Define products available in the store
  const [products, setProducts] = useState([
    { id: 1, name: 'Wireless Headphones', price: 100.00, imageUrl: 'https://placehold.co/80x80/CCCCCC/333333?text=Headphones' },
    { id: 2, name: 'Smartwatch', price: 150.00, imageUrl: 'https://placehold.co/80x80/CCCCCC/333333?text=Smartwatch' },
    { id: 3, name: 'Portable Speaker', price: 75.00, imageUrl: 'https://placehold.co/80x80/CCCCCC/333333?text=Speaker' },
    { id: 4, name: 'Gaming Mouse', price: 40.00, imageUrl: 'https://placehold.co/80x80/CCCCCC/333333?text=Mouse' },
  ]);

  // State for the items currently in the cart
  const [cart, setCart] = useState([]);
  // State to control the visibility of the checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // State to store checkout form details
  const [checkoutDetails, setCheckoutDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notificationId: '', // Placeholder for IPN notification ID required by Pesapal
  });
  // State for displaying payment status messages
  const [paymentStatus, setPaymentStatus] = useState('');
  // State for loading indicators during API calls
  const [loading, setLoading] = useState(false);
  // State for displaying error messages
  const [error, setError] = useState('');

  // Define the URL for your Flask backend
  const BACKEND_URL = 'http://127.0.0.1:5000'; // IMPORTANT: Replace with your actual backend URL if different

  // Function to add a product to the cart
  const addToCart = (productId) => {
    const productToAdd = products.find(p => p.id === productId);
    if (productToAdd) {
      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.productId === productId);
        if (existingItem) {
          // If item already exists, increase its quantity
          return prevCart.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          // If item is new, add it to the cart with quantity 1
          return [
            ...prevCart,
            {
              productId: productToAdd.id,
              name: productToAdd.name,
              price: productToAdd.price,
              quantity: 1,
            },
          ];
        }
      });
    }
  };

  // Function to update the quantity of an item in the cart
  const updateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) } // Ensure quantity doesn't go below 0
          : item
      );
      // Remove item from cart if its quantity becomes 0
      return updatedCart.filter(item => item.quantity > 0);
    });
  };

  // Function to remove an item completely from the cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  // Calculate the total price of all items in the cart
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Function to handle the checkout form submission and initiate payment
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true); // Set loading state
    setError(''); // Clear previous errors
    setPaymentStatus(''); // Clear previous payment status

    // Validate if cart has items and total is greater than zero
    if (totalCartPrice <= 0) {
      setError('Cart total must be greater than zero to proceed.');
      setLoading(false);
      return;
    }

    // Validate if a notification ID is provided
    if (!checkoutDetails.notificationId) {
      setError('Please provide a valid Pesapal IPN Notification ID.');
      setLoading(false);
      return;
    }

    // Prepare the payload for the Pesapal submit_order API
    const payload = {
      amount: totalCartPrice,
      currency: "KES", // Currency code for Kenyan Shillings
      description: `Payment for items in cart (Total: Ksh${totalCartPrice.toFixed(2)})`,
      // IMPORTANT: This callback_url must be a publicly accessible URL where Pesapal can redirect the user
      // and send IPN notifications after payment completion. Replace with your actual domain.
      callback_url: "https://yourdomain.com/pesapal-response",
      redirect_mode: "TOP_WINDOW", // Redirect in the same window
      notification_id: checkoutDetails.notificationId,
      billing_address: {
        email_address: checkoutDetails.email,
        phone_number: checkoutDetails.phone,
        first_name: checkoutDetails.firstName,
        last_name: checkoutDetails.lastName,
        country_code: "KE", // Default country code for Kenya
        // Add other billing address fields as needed by Pesapal
      }
    };

    try {
      // Make the API call to your Flask backend
      const response = await fetch(`${BACKEND_URL}/submit_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check if the response was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit order');
      }

      const data = await response.json();
      console.log('Pesapal submit order response:', data);

      // If Pesapal provides a redirect URL, navigate the user to it
      if (data.redirect_url) {
        setPaymentStatus('Redirecting to Pesapal...');
        window.location.href = data.redirect_url; // Perform the redirection
      } else {
        setError('No redirect URL received from Pesapal. Payment might have failed or details are incomplete.');
      }
    } catch (err) {
      // Catch and display any errors during the API call
      setError(`Payment error: ${err.message}`);
      console.error('Payment submission failed:', err);
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-inter">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8">
        {/* Product List Section */}
        <aside className="w-full lg:w-1/3 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Available Products</h2>
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="flex flex-col sm:flex-row items-center justify-between p-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50 hover:bg-gray-100 transition duration-200">
                <div className="flex items-center mb-2 sm:mb-0">
                  <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-md mr-3 border border-gray-300" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-gray-600">Ksh{product.price.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={() => addToCart(product.id)}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition duration-200 transform hover:scale-105 w-full sm:w-auto"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Shopping Cart Section */}
        <div className="w-full lg:w-2/3">
          <Cart
            cart={cart}
            products={products}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />

          {/* Checkout Button */}
          {cart.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="px-10 py-4 bg-green-600 text-white font-bold text-xl rounded-xl shadow-xl hover:bg-green-700 transition duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300"
              >
                Proceed to Checkout (Total: Ksh{totalCartPrice.toFixed(2)})
              </button>
            </div>
          )}

          {/* Checkout Modal */}
          {isCheckoutOpen && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative animate-fade-in-up">
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl font-bold transition duration-200"
                >
                  &times;
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Enter Your Details</h2>
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-gray-700 text-sm font-semibold mb-2">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      value={checkoutDetails.firstName}
                      onChange={(e) => setCheckoutDetails({ ...checkoutDetails, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-gray-700 text-sm font-semibold mb-2">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      value={checkoutDetails.lastName}
                      onChange={(e) => setCheckoutDetails({ ...checkoutDetails, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      value={checkoutDetails.email}
                      onChange={(e) => setCheckoutDetails({ ...checkoutDetails, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-gray-700 text-sm font-semibold mb-2">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      value={checkoutDetails.phone}
                      onChange={(e) => setCheckoutDetails({ ...checkoutDetails, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="notificationId" className="block text-gray-700 text-sm font-semibold mb-2">Pesapal IPN Notification ID</label>
                    <input
                      type="text"
                      id="notificationId"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      value={checkoutDetails.notificationId}
                      onChange={(e) => setCheckoutDetails({ ...checkoutDetails, notificationId: e.target.value })}
                      placeholder="e.g., your_ipn_id_from_pesapal_registration"
                      required
                    />
                     <p className="text-xs text-gray-500 mt-1">This ID is obtained after registering an IPN URL with Pesapal. For testing, you might use a dummy ID or obtain one via the backend's `/register_ipn_combined` endpoint.</p>
                  </div>

                  {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                  {paymentStatus && <p className="text-green-600 text-center text-sm">{paymentStatus}</p>}

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? 'Processing Payment...' : `Pay Now (Ksh${totalCartPrice.toFixed(2)})`}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
