import React, { useState, useEffect } from 'react';

function BillingModal({ cart, totalAmount, onClose }) {
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
        const ipnPayload = {
          url: 'http://localhost:5000/pesapal-ipn-listener',
          ipn_notification_type: 'GET'
        };

        const response = await fetch('http://localhost:5000/register_ipn_combined', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ipnPayload),
        });

        const data = await response.json();
        if (data.ipn_registration?.ipn_id) {
          setFetchedNotificationId(data.ipn_registration.ipn_id);
        } else {
          throw new Error('IPN ID not received.');
        }
      } catch (error) {
        setIpnError(`Failed to get Pesapal ID: ${error.message}`);
      } finally {
        setIsIpnLoading(false);
      }
    };

    registerIpn();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const initiatePayment = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (cart.length === 0) {
      setErrorMessage('Cart is empty.');
      setIsLoading(false);
      return;
    }

    if (isIpnLoading || ipnError || !fetchedNotificationId) {
      setErrorMessage('Pesapal IPN ID not ready.');
      setIsLoading(false);
      return;
    }

    const requiredFields = ['email', 'phone', 'firstName', 'lastName', 'line1', 'city'];
    for (const field of requiredFields) {
      if (!paymentDetails[field]) {
        setErrorMessage(`Please fill in '${field}'`);
        setIsLoading(false);
        return;
      }
    }

    const payload = {
      amount: parseFloat(totalAmount.toFixed(2)),
      currency: 'KES',
      description: paymentDetails.description,
      callback_url: paymentDetails.callbackUrl,
      notification_id: fetchedNotificationId,
      first_name: paymentDetails.firstName,
      last_name: paymentDetails.lastName,
      email: paymentDetails.email,
      phone: paymentDetails.phone,
      country_code: paymentDetails.countryCode,
      line_1: paymentDetails.line1,
      city: paymentDetails.city,
    };

    try {
      const res = await fetch('http://localhost:5000/submit_order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
if (data.redirect_url) {
  setSuccessMessage('Payment page loaded.');
  setIframeUrl(data.redirect_url);
      } else {
        throw new Error('No redirect URL');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-600 text-lg font-bold">&times;</button>
        <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Billing Information</h3>

        {isIpnLoading && <p className="text-center text-blue-600 mb-4">Fetching Pesapal Notification ID...</p>}
        {ipnError && <p className="text-red-500 text-center">{ipnError}</p>}

        <form onSubmit={initiatePayment} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" placeholder="First Name" onChange={handleChange} className="border p-2 rounded" />
            <input name="lastName" placeholder="Last Name" onChange={handleChange} className="border p-2 rounded" />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} className="border p-2 rounded" />
            <input name="phone" placeholder="Phone Number" onChange={handleChange} className="border p-2 rounded" />
            <input name="line1" placeholder="Address Line 1" onChange={handleChange} className="border p-2 rounded" />
            <input name="city" placeholder="City" onChange={handleChange} className="border p-2 rounded" />
          </div>

          {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}

          <div className="flex justify-center">
            <button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg">
              {isLoading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BillingModal;
