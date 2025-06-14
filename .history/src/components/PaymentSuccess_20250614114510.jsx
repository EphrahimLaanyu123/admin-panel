import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import supabase from '../supabaseClient'; // Adjust this import if needed

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState('Checking payment status...');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postMessage, setPostMessage] = useState('');

  useEffect(() => {
    const trackingId = searchParams.get('OrderTrackingId');
    const merchantRef = searchParams.get('OrderMerchantReference');

    if (!trackingId || !merchantRef) {
      setError('Missing payment details in the URL.');
      setPaymentStatus('Payment details not found.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/check_status?orderTrackingId=${trackingId}`
        );

        if (!response.ok) {
          throw new Error('Failed to communicate with payment server.');
        }

        const data = await response.json();

        if (data.payment_status_description === 'Completed') {
          setPaymentStatus('Payment Successful!');
          setTransactionDetails({
            trackingId,
            status: data.payment_status_description,
            amount: data.amount,
            method: data.payment_method,
            reference: data.payment_reference,
          });
        } else {
          setPaymentStatus(`Payment ${data.payment_status_description}`);
          setError(`Payment was not completed. Status: ${data.payment_status_description}`);
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('An error occurred while verifying the payment. Please try again.');
        setPaymentStatus('Error verifying payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleCompletePayment = async () => {
    setIsPosting(true);
    setPostMessage('');
    const orderId = localStorage.getItem('lastOrderId');

    if (!orderId || !transactionDetails) {
      setPostMessage('Order ID or transaction details missing.');
      setIsPosting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_tracking_id: transactionDetails.trackingId,
          payment_status: transactionDetails.status,
          amount: transactionDetails.amount,
          payment_method: transactionDetails.method,
          payment_reference: transactionDetails.reference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      setPostMessage('Order updated successfully in Supabase!');
    } catch (err) {
      console.error(err);
      setPostMessage(`Failed to update order: ${err.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4 text-green-800">{paymentStatus}</h1>

      {transactionDetails && (
        <div className="bg-white shadow-md p-6 rounded-md text-left max-w-md w-full">
          <p><strong>Tracking ID:</strong> {transactionDetails.trackingId}</p>
          <p><strong>Status:</strong> {transactionDetails.status}</p>
          <p><strong>Amount:</strong> KES {transactionDetails.amount}</p>
          {transactionDetails.method && (
            <p><strong>Method:</strong> {transactionDetails.method}</p>
          )}
          {transactionDetails.reference && (
            <p><strong>Reference:</strong> {transactionDetails.reference}</p>
          )}

          <button
            onClick={handleCompletePayment}
            disabled={isPosting}
            className="mt-6 w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
          >
            {isPosting ? 'Posting...' : 'Complete Payment'}
          </button>

          {postMessage && (
            <p className="mt-4 text-center text-sm text-gray-700">{postMessage}</p>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-600 mt-4 text-center">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
