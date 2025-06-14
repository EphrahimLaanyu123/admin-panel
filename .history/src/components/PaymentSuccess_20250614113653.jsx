import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [paymentStatus, setPaymentStatus] = useState('Checking payment status...');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [isUpdatingDb, setIsUpdatingDb] = useState(false);

  useEffect(() => {
    const trackingId = searchParams.get('OrderTrackingId');
    const merchantRef = searchParams.get('OrderMerchantReference');

    setError('');
    setSuccessMessage('');

    if (!trackingId || !merchantRef) {
      setError('Missing payment details in the URL. Please ensure both OrderTrackingId and OrderMerchantReference are present.');
      setPaymentStatus('Payment details not found.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`http://localhost:5000/check_status?orderTrackingId=${trackingId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to communicate with payment server.');
        }

        const data = await response.json();
        setPaymentData(data);

        if (data.payment_status_description === 'Completed') {
          setPaymentStatus('Payment Successful!');
          setTimeout(() => handleCompletePayment(data), 500);
        } else {
          setPaymentStatus(`Payment ${data.payment_status_description}`);
          setError(`Status: ${data.payment_status_description}. Your payment was not successful or is still pending.`);
        }

        setTransactionDetails({
          trackingId,
          status: data.payment_status_description,
          amount: data.amount,
          method: data.payment_method,
          reference: data.payment_reference,
          merchantReference: merchantRef,
        });
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError(`Error verifying payment: ${err.message}`);
        setPaymentStatus('Error verifying payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleCompletePayment = async (dataFromVerification = paymentData) => {
    if (isUpdatingDb || !dataFromVerification) {
      if (!dataFromVerification) setError('No payment data available to complete order.');
      return;
    }

    const lastOrderId = localStorage.getItem('lastOrderId');

    if (!lastOrderId) {
      setError('Order ID not found in localStorage. Cannot update order.');
      return;
    }

    setIsUpdatingDb(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error: supabaseUpdateError } = await supabase
        .from('orders')
        .update({
          payment_status: dataFromVerification.payment_status_description,
          confirmation_code: dataFromVerification.confirmation_code || null,
          payment_method: dataFromVerification.payment_method || null,
          payment_reference: dataFromVerification.payment_reference || null,
          payment_account: dataFromVerification.payment_account || null,
          tracking_id: dataFromVerification.order_tracking_id || null,
          merchant_reference: dataFromVerification.order_merchant_reference || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lastOrderId);

      if (supabaseUpdateError) {
        throw new Error(`Supabase update failed: ${supabaseUpdateError.message}`);
      }

      setSuccessMessage('Order successfully updated in the database!');
    } catch (err) {
      console.error('Error updating Supabase:', err);
      setError(`Error updating order: ${err.message}`);
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
            <p className="mb-2"><strong className="text-gray-600">Merchant Reference:</strong> <span className="font-mono text-sm break-all">{transactionDetails.merchantReference}</span></p>
            <p className="mb-2"><strong className="text-gray-600">Status:</strong> <span className={`font-semibold ${transactionDetails.status === 'Completed' ? 'text-green-600' : 'text-red-500'}`}>{transactionDetails.status}</span></p>
            <p className="mb-2"><strong className="text-gray-600">Amount:</strong> KES {transactionDetails.amount?.toFixed(2) || 'N/A'}</p>
            {transactionDetails.method && <p className="mb-2"><strong className="text-gray-600">Method:</strong> {transactionDetails.method}</p>}
            {transactionDetails.reference && <p className="mb-2"><strong className="text-gray-600">Payment Reference:</strong> <span className="font-mono text-sm break-all">{transactionDetails.reference}</span></p>}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            {error}
          </div>
        )}

        {transactionDetails && transactionDetails.status !== 'Completed' && !successMessage && (
          <button
            onClick={() => handleCompletePayment()}
            disabled={isUpdatingDb}
            className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
              isUpdatingDb
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isUpdatingDb ? 'Updating Order...' : 'Manually Update Order Status'}
          </button>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 py-3 px-4 rounded-md text-blue-600 font-semibold border border-blue-600 hover:bg-blue-50"
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
