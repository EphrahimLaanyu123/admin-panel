import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [paymentStatus, setPaymentStatus] = useState('Checking payment status...');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [isUpdatingDb, setIsUpdatingDb] = useState(false); // State for DB update loading

  useEffect(() => {
    const trackingId = searchParams.get('OrderTrackingId');
    const merchantRef = searchParams.get('OrderMerchantReference');

    // Clear messages on component mount/param change
    setError('');
    setSuccessMessage('');

    if (!trackingId || !merchantRef) {
      setError('Missing payment details in the URL. Please ensure both OrderTrackingId and OrderMerchantReference are present.');
      setPaymentStatus('Payment details not found.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/check_status?orderTrackingId=${trackingId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to communicate with payment server for status check.');
        }

        const data = await response.json();
        setPaymentData(data); // Save full data for DB update later

        if (data.payment_status_description === 'Completed') {
          setPaymentStatus('Payment Successful!');
          // Automatically attempt to update the database via backend if payment is completed
          setTimeout(() => handleCompletePayment(data, merchantRef), 500);
        } else {
          setPaymentStatus(`Payment ${data.payment_status_description}`);
          setError(`Status: ${data.payment_status_description}. Your payment was not successful.`);
        }

        setTransactionDetails({
          trackingId: trackingId,
          status: data.payment_status_description,
          amount: data.amount,
          method: data.payment_method,
          reference: data.payment_reference,
          merchantReference: merchantRef, // Use merchantRef from URL for consistency
        });

      } catch (err) {
        console.error('Error verifying payment:', err);
        setError(`An error occurred while verifying the payment: ${err.message}`);
        setPaymentStatus('Error verifying payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleCompletePayment = async (dataFromVerification = paymentData, merchantRefFromUrl = searchParams.get('OrderMerchantReference')) => {
    if (isUpdatingDb || !dataFromVerification || !merchantRefFromUrl) {
      if (!dataFromVerification) setError('No payment data available to complete order.');
      if (!merchantRefFromUrl) setError('Cannot complete payment: Merchant Reference is missing from URL.');
      return;
    }

    setIsUpdatingDb(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        merchant_reference: merchantRefFromUrl, // Key to find the order
        payment_status: dataFromVerification.payment_status_description,
        confirmation_code: dataFromVerification.confirmation_code || null,
        payment_method: dataFromVerification.payment_method || null,
        payment_reference: dataFromVerification.payment_reference || null,
        payment_account: dataFromVerification.payment_account || null,
        // Include other fields from dataFromVerification if needed for backend logic
      };

      const response = await fetch('http://localhost:5000/update_order_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status via backend.');
      }

      const result = await response.json();
      if (result.success) {
        setSuccessMessage('Order status successfully updated in database!');
      } else {
        setError(result.message || 'Failed to update order status via backend.');
      }

    } catch (err) {
      console.error('Backend Update Exception:', err);
      setError(`An unexpected error occurred during database update: ${err.message}`);
    } finally {
      setIsUpdatingDb(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex flex-col items-center justify-center p-6 font-inter">
      <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full text-center border border-gray-200">
        <h1 className={`text-4xl font-extrabold mb-6 ${error ? 'text-red-700' : 'text-green-800'}`}>
          {paymentStatus}
        </h1>

        {transactionDetails && (
          <div className="text-left bg-gray-50 p-6 rounded-lg mb-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Transaction Summary</h3>
            <p className="mb-2"><strong className="text-gray-600">Tracking ID:</strong> <span className="font-mono text-sm break-all">{transactionDetails.trackingId}</span></p>
            <p className="mb-2"><strong className="text-gray-600">Merchant Reference:</strong> <span className="font-mono text-sm break-all">{transactionDetails.merchantReference || 'N/A'}</span></p>
            <p className="mb-2"><strong className="text-gray-600">Status:</strong> <span className={`font-semibold ${transactionDetails.status === 'Completed' ? 'text-green-600' : 'text-red-500'}`}>{transactionDetails.status}</span></p>
            <p className="mb-2"><strong className="text-gray-600">Amount:</strong> KES {transactionDetails.amount ? transactionDetails.amount.toFixed(2) : 'N/A'}</p>
            {transactionDetails.method && <p className="mb-2"><strong className="text-gray-600">Method:</strong> {transactionDetails.method}</p>}
            {transactionDetails.reference && <p className="mb-2"><strong className="text-gray-600">Payment Reference:</strong> <span className="font-mono text-sm break-all">{transactionDetails.reference}</span></p>}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {transactionDetails && transactionDetails.status !== 'Completed' && (
          <button
            onClick={() => handleCompletePayment()}
            disabled={isUpdatingDb}
            className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isUpdatingDb
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {isUpdatingDb ? 'Updating Order...' : 'Manually Update Order Status'}
          </button>
        )}

        <button
            onClick={() => navigate('/')}
            className="w-full mt-4 py-3 px-4 rounded-md text-blue-600 font-semibold border border-blue-600 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back Home
          </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
