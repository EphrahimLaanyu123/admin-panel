import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState('Checking payment status...');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState('');

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
            reference: data.payment_reference
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
  

  return (
    <div className="min-h-screen bg-green-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4 text-green-800">{paymentStatus}</h1>

      {transactionDetails && (
        <div className="bg-white shadow-md p-6 rounded-md text-left max-w-md w-full">
          <p><strong>Tracking ID:</strong> {transactionDetails.trackingId}</p>
          <p><strong>Status:</strong> {transactionDetails.status}</p>
          <p><strong>Amount:</strong> KES {transactionDetails.amount}</p>
          <p><strong>Merchant Reference:</strong> {merchantRef}</p>

          {transactionDetails.method && (
            <p><strong>Method:</strong> {transactionDetails.method}</p>
          )}
          {transactionDetails.reference && (
            <p><strong>Reference:</strong> {transactionDetails.reference}</p>
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
