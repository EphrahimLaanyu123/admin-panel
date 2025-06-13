import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('Verifying payment...');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const trackingId = searchParams.get('tracking_id');
    const status = searchParams.get('status');

    if (trackingId && status) {
      setPaymentStatus(`Payment ${status.toLowerCase()} for Tracking ID: ${trackingId}`);
      // In a real application, you would make an API call to your backend
      // to verify the payment using the tracking_id.
      // Example: fetch('/verify-pesapal-payment?trackingId=' + trackingId)
      // and update state based on the backend response.

      // For demonstration purposes:
      const verifyPayment = async () => {
        try {
          // Replace with your actual backend endpoint for verification
          const response = await fetch(`http://localhost:5000/verify_payment_status?tracking_id=${trackingId}`);
          if (!response.ok) {
            throw new Error('Failed to verify payment with backend.');
          }
          const data = await response.json();
          if (data.status === 'COMPLETED') {
            setPaymentStatus('Payment Successful!');
            setTransactionDetails(data.transaction_details);
          } else {
            setPaymentStatus(`Payment ${data.status.toLowerCase()}.`);
            setError(`Payment status is ${data.status}. If you believe this is an error, please contact support.`);
          }
        } catch (err) {
          console.error('Error verifying payment:', err);
          setPaymentStatus('Error verifying payment.');
          setError('Could not verify payment status with our system. Please check your order history or contact support.');
        }
      };

      verifyPayment();

    } else {
      setPaymentStatus('No payment details found.');
      setError('Missing tracking ID or status in the URL.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Payment Status</h2>
        <p className="text-lg text-gray-700 mb-6">{paymentStatus}</p>

        {transactionDetails && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
            <h3 className="text-xl font-semibold text-green-700 mb-2">Transaction Details:</h3>
            <p><strong>Tracking ID:</strong> {transactionDetails.tracking_id}</p>
            <p><strong>Status:</strong> {transactionDetails.status}</p>
            <p><strong>Amount:</strong> Ksh{parseFloat(transactionDetails.amount).toFixed(2)}</p>
            {/* Add more details as needed */}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm mt-4 p-2 bg-red-100 border border-red-400 rounded">
            {error}
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="mt-6 py-3 px-6 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;