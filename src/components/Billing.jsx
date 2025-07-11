import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

function Billing({ cart, products }) {
  const navigate = useNavigate();

  const [fetchedNotificationId, setFetchedNotificationId] = useState('');
  const [isIpnLoading, setIsIpnLoading] = useState(true);
  const [ipnError, setIpnError] = useState('');

  const [paymentDetails, setPaymentDetails] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    countryCode: 'KE',
    line1: '',
    city: '',
    description: 'Online Store Purchase',
    callbackUrl: 'http://localhost:5173/payment-success',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const registerIpn = async () => {
      setIsIpnLoading(true);
      setIpnError('');
      try {
        const response = await fetch('http://localhost:5000/register_ipn_combined', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: 'http://localhost:5000/pesapal-ipn-listener',
            ipn_notification_type: 'GET',
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.ipn_registration?.ipn_id) {
          throw new Error(data?.error || 'IPN registration failed.');
        }
        setFetchedNotificationId(data.ipn_registration.ipn_id);
      } catch (error) {
        setIpnError(`Failed to get Pesapal ID: ${error.message}`);
      } finally {
        setIsIpnLoading(false);
      }
    };

    registerIpn();
  }, []);

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const initiatePayment = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty.');
      setIsLoading(false);
      return;
    }

    if (isIpnLoading || ipnError || !fetchedNotificationId) {
      setErrorMessage('Pesapal Notification ID is not ready.');
      setIsLoading(false);
      return;
    }

    const requiredFields = ['email', 'phone', 'firstName', 'lastName', 'line1', 'city'];
    for (const field of requiredFields) {
      if (!paymentDetails[field]) {
        setErrorMessage(`Please fill in the '${field}' field.`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const { data: insertedOrder, error } = await supabase
        .from('orders')
        .insert([
          {
            email: paymentDetails.email,
            phone: paymentDetails.phone,
            first_name: paymentDetails.firstName,
            last_name: paymentDetails.lastName,
            address_line_1: paymentDetails.line1,
            city: paymentDetails.city,
            country_code: paymentDetails.countryCode,
            total_amount: parseFloat(totalCartPrice.toFixed(2)),
            currency: 'KES',
            description: paymentDetails.description,
            cart_items: JSON.stringify(cart),
            payment_status: 'PENDING',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (error || !insertedOrder?.id) {
        throw new Error(error?.message || 'Order creation failed');
      }

      const orderId = insertedOrder.id;
      localStorage.setItem('lastOrderId', orderId);

      const callbackUrlWithRef = `${paymentDetails.callbackUrl}?OrderMerchantReference=${orderId}`;

      const payload = {
        id: orderId,
        amount: parseFloat(totalCartPrice.toFixed(2)),
        currency: 'KES',
        description: paymentDetails.description,
        callback_url: callbackUrlWithRef,
        notification_id: fetchedNotificationId,
        first_name: paymentDetails.firstName,
        last_name: paymentDetails.lastName,
        email: paymentDetails.email,
        phone: paymentDetails.phone,
        country_code: paymentDetails.countryCode,
        line_1: paymentDetails.line1,
        city: paymentDetails.city,
      };

      const response = await fetch('http://localhost:5000/submit_order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.redirect_url) {
        throw new Error(data?.error || 'Failed to get redirect URL from Pesapal.');
      }

      setSuccessMessage('Redirecting to Pesapal...');
      window.location.href = data.redirect_url;
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full max-w-3xl bg-white p-8 rounded-xl shadow-2xl mx-auto my-8 font-inter">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Billing Information</h2>

      {cart.length === 0 ? (
        <p className="text-gray-600 text-center text-lg">
          Your cart is empty.
          <br />
          <button
            onClick={() => navigate('/')}
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Shop
          </button>
        </p>
      ) : (
        <>
          <div className="text-right mt-6 text-xl font-semibold text-blue-700">
            Total for Payment: Ksh{totalCartPrice.toFixed(2)}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            {isIpnLoading && (
              <p className="text-center text-blue-600 mb-4">Fetching Pesapal Notification ID...</p>
            )}
            {ipnError && (
              <div className="text-red-600 text-center text-sm mt-4 p-2 bg-red-100 border border-red-400 rounded">
                {ipnError}
              </div>
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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
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
                disabled={isLoading || isIpnLoading || ipnError || !fetchedNotificationId || cart.length === 0}
                className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
                  (isLoading || isIpnLoading || ipnError || !fetchedNotificationId || cart.length === 0)
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Processing Payment...' : (isIpnLoading ? 'Fetching Pesapal ID...' : 'Proceed to Pay')}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full py-3 px-4 mt-2 rounded-md text-blue-600 font-semibold border border-blue-600 hover:bg-blue-50 transition-colors duration-200"
              >
                Back to Cart
              </button>
            </form>
          </div>
        </>
      )}
    </main>
  );
}

export default Billing;
