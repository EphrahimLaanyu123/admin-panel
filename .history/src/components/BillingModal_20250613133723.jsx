import React, { useState } from 'react';
import axios from 'axios';

const BillingModal = ({ isOpen, onClose, cartItems }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    line1: '',
    city: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const initiatePayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      ...formData,
      amount: cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
      description: 'Order payment',
    };

    try {
      const response = await axios.post('http://localhost:5000/api/initiate-payment', payload);
      const { redirect_url } = response.data;

      if (redirect_url) {
        setSuccessMessage('Payment page loaded.');
        setIframeUrl(redirect_url);
      } else {
        setErrorMessage('Failed to initiate payment.');
      }
    } catch (err) {
      setErrorMessage('Payment initiation failed.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl p-6 rounded-lg relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl font-bold"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">Billing & Payment</h2>

        {iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="w-full h-[600px] rounded-xl border"
            title="Pesapal Payment"
          />
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default BillingModal;
