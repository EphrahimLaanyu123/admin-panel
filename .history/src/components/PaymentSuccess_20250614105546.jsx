import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://<your-project-id>.supabase.co',
  '<your-anon-key>'
);

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

        setTransactionDetails({
          trackingId,
          status: data.payment_status_description,
          amount: data.amount,
          method: data.payment_method,
          reference: data.confirmation_code || data.payment_account,
        });

        if (data.payment_status_description === 'Completed') {
          setPaymentStatus('Payment Successful!');

          // Insert into Supabase
          const { error: supabaseError } = await supabase.from('orders').insert([
            {
              email: 'unknown@unknown.com', // replace with real email if stored elsewhere
              phone: 'unknown',             // same here
              first_name: 'Customer',
              last_name: 'Name',
              address_line_1: 'N/A',
              city: 'Nairobi',
              total_amount: data.amount,
              description: data.description || '',
              currency: data.currency || 'KES',
              cart_items: [], // optional: replace with stored cart info
              status: data.payment_status_description,
            },
          ]);

          if (supabaseError) {
            console.error('Supabase insert error:', supabaseError.message);
            setError('Could not save payment details.');
          }

        } else {
          setPaymentStatus(`Payment ${data.payment_status_description}`);
          setError(`Payment failed or incomplete: ${data.description || 'Unknown issue'}`);
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
