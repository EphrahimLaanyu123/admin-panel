import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

function Cart({ cart, updateQuantity, removeFromCart }) {
  // Products are now managed locally within Cart.jsx for self-containment
  // You might want to fetch these from an API in a real application
  const [products] = useState([
    { id: '1', name: 'Premium Coffee Beans', price: 1500.00, imageUrl: 'https://placehold.co/80x80/000000/FFFFFF?text=Coffee' },
    { id: '2', name: 'Organic Green Tea', price: 1000.00, imageUrl: 'https://placehold.co/80x80/4CAF50/FFFFFF?text=Tea' },
    { id: '3', name: 'Artisan Chocolate Bar', price: 750.00, imageUrl: 'https://placehold.co/80x80/8B4513/FFFFFF?text=Choco' },
    { id: '4', name: 'Ceramic Mug Set', price: 2200.00, imageUrl: 'https://placehold.co/80x80/B0E0E6/333333?text=Mugs' },
    { id: '5', name: 'Reusable Water Bottle', price: 800.00, imageUrl: 'https://placehold.co/80x80/90EE90/333333?text=Bottle' },
  ]);

  // State to hold payment form details
  const [paymentDetails, setPaymentDetails] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    countryCode: 'KE', // Default to Kenya for Pesapal
    line1: '', // Address line 1
    city: '',
    description: 'Online Store Purchase',
    // IMPORTANT: Replace this with your actual frontend callback URL where Pesapal will redirect after payment
    // This should match the URL in your Flask backend's CORS origins if you're testing locally.
    callbackUrl: 'http://localhost:5173/payment-success',
    notificationId: 'your_notification_id_here', // You need to replace this with a real IPN notification ID from Pesapal
  });

  // UI states for loading, error, and success messages
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Helper function to get image URL for a product
  const getImageUrl = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product?.imageUrl || 'https://placehold.co/80x80/CCCCCC/333333?text=Item';
  };

  // Calculate the total price of all items in the cart
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Handler for changes in payment form input fields
  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  // Function to initiate the payment process by calling the backend
  const initiatePayment = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    setIsLoading(true); // Set loading state to true
    setErrorMessage(''); // Clear previous error messages
    setSuccessMessage(''); // Clear previous success messages

    // Basic validation: Check if cart is empty
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before proceeding to payment.');
      setIsLoading(false);
      return;
    }

    // Basic validation: Check required fields
    const requiredFields = ['email', 'phone', 'firstName', 'lastName', 'line1', 'city', 'notificationId'];
    for (const field of requiredFields) {
      if (!paymentDetails[field]) {
        setErrorMessage(`Please fill in the '${field}' field.`);
        setIsLoading(false);
        return;
      }
    }

    // Construct the payload for your Flask backend
    const payload = {
      amount: parseFloat(totalCartPrice.toFixed(2)), // Ensure amount is a number
      currency: "KES", // Assuming KES as per your backend
      description: paymentDetails.description,
      callback_url: paymentDetails.callbackUrl,
      notification_id: paymentDetails.notificationId,
      first_name: paymentDetails.firstName,
      last_name: paymentDetails.lastName,
      email: paymentDetails.email,
      phone: paymentDetails.phone,
      country_code: paymentDetails.countryCode,
      line_1: paymentDetails.line1,
      city: paymentDetails.city,
      // You can add other optional fields here if needed by your backend
      // merchant_id: "your_merchant_id", // If you need a specific merchant ID
    };

    try {
      // Make the API call to your Flask backend's submit_order endpoint
      const response = await fetch('http://localhost:5000/submit_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // If the response is not OK (e.g., 4xx or 5xx), parse the error
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initiation failed on backend.');
      }

      const data = await response.json();
      console.log('Pesapal response:', data);

      if (data.redirect_url) {
        setSuccessMessage('Redirecting to Pesapal...');
        window.location.href = data.redirect_url; // Redirect to Pesapal payment page
      } else {
        setErrorMessage('Payment initiation failed: No redirect URL received.');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      setErrorMessage(`Payment failed: ${error.message}`);
    } finally {
      setIsLoading(false); // End loading state
    }
  };

  return (
    <main className="w-full max-w-3xl bg-white p-8 rounded-xl shadow-2xl mx-auto my-8">
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
                    src={getImageUrl(item.productId)}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg mr-4"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/80x80/CCCCCC/333333?text=Item';
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-gray-600">Ksh{item.price.toFixed(2)} each</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
          <div className="text-right mt-6 text-xl font-semibold text-blue-700">
            Total: Ksh{totalCartPrice.toFixed(2)}
          </div>

          {/* Billing Information Form */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Billing Information</h3>
            <form onSubmit={initiatePayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={paymentDetails.firstName}
                    onChange={handlePaymentDetailsChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={paymentDetails.lastName}
                    onChange={handlePaymentDetailsChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={paymentDetails.email}
                  onChange={handlePaymentDetailsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={paymentDetails.phone}
                  onChange={handlePaymentDetailsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="line1" className="block text-sm font-medium text-gray-700">Address Line 1</label>
                <input
                  type="text"
                  id="line1"
                  name="line1"
                  value={paymentDetails.line1}
                  onChange={handlePaymentDetailsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={paymentDetails.city}
                  onChange={handlePaymentDetailsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="notificationId" className="block text-sm font-medium text-gray-700">Pesapal Notification ID</label>
                <input
                  type="text"
                  id="notificationId"
                  name="notificationId"
                  value={paymentDetails.notificationId}
                  onChange={handlePaymentDetailsChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., from register_ipn_combined"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  This is the `ipn_id` you received when registering your IPN URL with Pesapal.
                </p>
              </div>

              {errorMessage && (
                <div className="text-red-600 text-center text-sm mt-4 p-2 bg-red-100 border border-red-400 rounded">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="text-green-600 text-center text-sm mt-4 p-2 bg-green-100 border border-green-400 rounded">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
                  isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Processing Payment...' : 'Proceed to Pay'}
              </button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}

export default Cart;
