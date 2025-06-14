import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://zfuixgtrrjtihegcolvx.supabase.co', // 🔁 Replace with your Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmdWl4Z3Rycmp0aWhlZ2NvbHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MDgzMjUsImV4cCI6MjA2NTM4NDMyNX0.eZwJc9L96rRq5BnN3rr8I2igbJ4Eo_VVoaXcq5V4ktU
' // 🔁 Replace with your Supabase anon key
);

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState('Checking payment status...');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentData, setPaymentData] = useState(null);

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
        setPaymentData(data); // Save full data for DB insert later

        if (data.payment_status_description === 'Completed') {
          setPaymentStatus('Payment Successful!');
        } else {
          setPaymentStatus(`Payment ${data.payment_status_description}`);
          setError(`Status: ${data.payment_status_description}`);
        }

        setTransactionDetails({
          trackingId,
          status: data.payment_status_description,
          amount: data.amount,
          method: data.payment_method,
          reference: data.payment_reference,
        });
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('An error occurred while verifying the payment.');
        setPaymentStatus('Error verifying payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleCompletePayment = async () => {
    if (!paymentData) return setError('No payment data available.');

    const { payment_method, amount, created_date, confirmation_code, payment_status_description,
      description, merchant_reference, payment_reference, payment_account, currency } = paymentData;

    const { data, error } = await supabase.from('orders').insert([
      {
        tracking_id: transactionDetails.trackingId,
        merchant_reference: merchant_reference,
        amount: amount,
        payment_method: payment_method,
        payment_status: payment_status_description,
        confirmation_code: confirmation_code,
        created_date: created_date,
        description: description,
        payment_account: payment_account,
        currency: currency,
        payment_reference: payment_reference
      }
    ]);

    if (error) {
      console.error('Error inserting into Supabase:', error);
      setSuccessMessage('');
      setError('Failed to save order to database.');
    } else {
      setError('');
      setSuccessMessage('Order successfully saved to database!');
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
          {transactionDetails.method && <p><strong>Method:</strong> {transactionDetails.method}</p>}
          {transactionDetails.reference && <p><strong>Reference:</strong> {transactionDetails.reference}</p>}

          <button
            onClick={handleCompletePayment}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            Complete Payment
          </button>
        </div>
      )}

      {successMessage && (
        <div className="text-green-700 mt-4">{successMessage}</div>
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
