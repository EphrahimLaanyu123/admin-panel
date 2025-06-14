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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const trackingId = searchParams.get('OrderTrackingId');
    const merchantRef = searchParams.get('OrderMerchantReference');

    setError('');
    setSuccessMessage('');

    if (!trackingId || !merchantRef) {
      setError('Missing payment details in the URL.');
      setPaymentStatus('Payment details not found.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`http://localhost:5000/check_status?orderTrackingId=${trackingId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to verify payment status.');
        }

        const data = await response.json();
        setPaymentData(data);

        setTransactionDetails({
          trackingId,
          status: data.payment_status_description,
          amount: data.amount,
          method: data.payment_method,
          reference: data.payment_reference,
          merchantReference: merchantRef,
        });

        if (data.payment_status_description === 'Completed') {
          setPaymentStatus('Payment Successful!');
        } else {
          setPaymentStatus(`Payment ${data.payment_status_description}`);
          setError(`Status: ${data.payment_status_description}`);
        }
      } catch (err) {
        console.error(err);
        setError(`Error verifying payment: ${err.message}`);
        setPaymentStatus('Verification Error');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handlePostToSupabase = async () => {
    if (!paymentData) {
      setError('No payment data available to post.');
      return;
    }

    const lastOrderId = localStorage.getItem('lastOrderId');
    if (!lastOrderId) {
      setError('Order ID not found in localStorage.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error: insertError } = await supabase.from('orders').insert([
        {
          id: lastOrderId, // custom UUID from localStorage
          payment_status: paymentData.payment_status_description,
          confirmation_code: paymentData.confirmation_code || null,
          payment_method: paymentData.payment_method || null,
          payment_reference: paymentData.payment_reference || null,
          payment_account: paymentData.payment_account || null,
          tracking_id: paymentData.order_tracking_id || searchParams.get('OrderTrackingId'),
          merchant_reference: paymentData.order_merchant_reference || searchParams.get('OrderMerchantReference'),
          amount: paymentData.amount || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        throw new Error(`Supabase insert failed: ${insertError.message}`);
      }

      setSuccessMessage('Order successfully posted to Supabase!');
      localStorage.removeItem('lastOrderId'); // Optional: clear after successful submission
    } catch (err) {
      console.error(err);
      setError(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
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
            <p className="mb-2"><strong className="text-gray-600">Merchant Ref:</strong> <span className="font-mono text-sm break-all">{transactionDetails.merchantReference}</span></p>
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

        {/* ✅ Complete Payment Button */}
        {transactionDetails && (
          <button
            onClick={handlePostToSupabase}
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-colors duration-200 ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Posting to Supabase...' : 'Complete Payment'}
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
