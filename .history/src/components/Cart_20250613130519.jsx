import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

// IMPORTANT: In a real local development environment, you would install
// @supabase/supabase-js: npm install @supabase/supabase-js or yarn add @supabase/supabase-js
// and then use: import { createClient } from '@supabase/supabase-js';
//
// For this interactive environment, to avoid compilation errors due to missing modules,
// we're creating a mock Supabase client.
// If you run this code locally, uncomment the actual import and provide your keys.

// const { createClient } = require('@supabase/supabase-js'); // Uncomment for local environment with npm package

// Mock Supabase client for demonstration in this environment
const supabase = {
  from: (tableName) => ({
    insert: async (data) => {
      console.warn(`[Supabase Mock]: Attempting to insert into table "${tableName}":`, data);
      // Simulate a successful insertion for demonstration purposes
      return { data: data, error: null };
    },
  }),
};

// IMPORTANT: Replace with your actual Supabase project URL and anon key when running locally
// const supabaseUrl = 'YOUR_SUPABASE_URL'; // e.g., https://xyzabcd.supabase.co
// const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // This is your public anon key
// const supabase = createClient(supabaseUrl, supabaseAnonKey); // Uncomment for local environment


// Cart expects 'products' to be passed as a prop from a parent component
function Cart({ cart, products, updateQuantity, removeFromCart }) {
  // State to hold the dynamically fetched Pesapal Notification ID (IPN ID)
  const [fetchedNotificationId, setFetchedNotificationId] = useState('');
  // States for managing the loading and error states of IPN registration
  const [isIpnLoading, setIsIpnLoading] = useState(true);
  const [ipnError, setIpnError] = useState('');

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
    // notificationId is now fetched automatically, not part of initial state
  });

  // UI states for loading, error, and success messages for payment submission
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Effect to fetch the Pesapal Notification ID when the component mounts
  useEffect(() => {
    const registerIpn = async () => {
      setIsIpnLoading(true);
      setIpnError('');
      try {
        // You'll need to provide a real URL for your IPN listener on your backend.
        // For development, this URL doesn't have to be externally accessible,
        // but Pesapal expects a valid URL format for registration.
        const ipnPayload = {
          url: 'http://localhost:5000/pesapal-ipn-listener', // This should be your actual IPN listener URL
          ipn_notification_type: 'GET' // Or POST, depending on your Pesapal setup
        };

        const response = await fetch('http://localhost:5000/register_ipn_combined', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ipnPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to register IPN URL on backend.');
        }

        const data = await response.json();
        console.log('IPN Registration Data:', data);
        if (data.ipn_registration && data.ipn_registration.ipn_id) {
          setFetchedNotificationId(data.ipn_registration.ipn_id);
        } else {
          throw new Error('IPN registration successful, but no IPN ID received.');
        }
      } catch (error) {
        console.error('Error during IPN registration:', error);
        setIpnError(`Failed to get Pesapal ID: ${error.message}. Please check your backend.`);
      } finally {
        setIsIpnLoading(false);
      }
    };

    registerIpn();
  }, []); // Empty dependency array means this runs once on mount

  // Helper function to get image URL for a product
  // This function relies on the 'products' prop to find the image URL
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

    // Ensure IPN ID is available before proceeding
    if (isIpnLoading) {
      setErrorMessage('Still fetching Pesapal Notification ID. Please wait.');
      setIsLoading(false);
      return;
    }

    if (ipnError) {
      setErrorMessage(`Cannot proceed: ${ipnError}`);
      setIsLoading(false);
      return;
    }

    if (!fetchedNotificationId) {
      setErrorMessage('Pesapal Notification ID is not available. Please try again.');
      setIsLoading(false);
      return;
    }

    // Basic validation: Check required fields
    const requiredFields = ['email', 'phone', 'firstName', 'lastName', 'line1', 'city'];
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
      notification_id: fetchedNotificationId, // Use the dynamically fetched ID here
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

        // --- Supabase Insertion ---
        try {
          // This will use the mock supabase client for demonstration
          const { error: supabaseError } = await supabase
            .from('orders')
            .insert([
              {
                order_tracking_id: data.order_tracking_id,
                merchant_reference: data.merchant_reference,
                redirect_url: data.redirect_url,
                amount: payload.amount,
                currency: payload.currency,
                user_email: payload.email,
                status: 'pending', // Initial status
              },
            ]);

          if (supabaseError) {
            console.error('Supabase insertion error:', supabaseError);
            setErrorMessage(`Failed to save order details: ${supabaseError.message}`);
            // Decide if you want to proceed with redirect even if Supabase insert fails
            // For now, it will still redirect
          } else {
            console.log('Order details saved to Supabase successfully!');
          }
        } catch (dbError) {
          console.error('Error during Supabase operation:', dbError);
          setErrorMessage(`Database error: ${dbError.message}`);
        }
        // --- End Supabase Insertion ---

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
            {isIpnLoading && (
              <p className="text-center text-blue-600 mb-4">Fetching Pesapal Notification ID...</p>
            )}
            {ipnError && (
              <div className="text-red-600 text-center text-sm mt-4 p-2 bg-red-100 border border-red-400 rounded">
                {ipnError}
              </div>
            )}
            {!fetchedNotificationId && !isIpnLoading && !ipnError && (
              <p className="text-center text-yellow-600 mb-4">
                Pesapal Notification ID could not be fetched. Payment may not work.
              </p>
            )}

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
              {/* Notification ID input removed as it's now fetched dynamically */}

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
                // Disable button if loading, if IPN is still fetching, or if there's an IPN error
                disabled={isLoading || isIpnLoading || ipnError || !fetchedNotificationId}
                className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
                  (isLoading || isIpnLoading || ipnError || !fetchedNotificationId) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Processing Payment...' : (isIpnLoading ? 'Fetching Pesapal ID...' : 'Proceed to Pay')}
              </button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}

export default Cart;
