import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import BillingModal from './BillingModal';

function Cart({ cart, products, updateQuantity, removeFromCart }) {
  const [showBillingModal, setShowBillingModal] = useState(false);

  const getImageUrl = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product?.imageUrl || 'https://placehold.co/80x80/CCCCCC/333333?text=Item';
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="w-full max-w-3xl bg-white p-8 rounded-xl shadow-2xl mx-auto my-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Shopping Cart</h2>
      {cart.length === 0 ? (
        <p className="text-gray-600 text-center text-lg">Your cart is empty. Start shopping!</p>
      ) : (
        <>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <img
                    src={getImageUrl(item.productId)}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg mr-4"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/80x80/CCCCCC/333333?text=Item';
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-gray-600">Ksh{item.price.toFixed(2)} each</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                </div>
                <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
          <div className="text-right mt-6 text-xl font-semibold text-blue-700">
            Total: Ksh{totalCartPrice.toFixed(2)}
          </div>

          <div className="flex justify-center mt-6">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              onClick={() => setShowBillingModal(true)}
            >
              Proceed to Payment
            </button>
          </div>

          {/* Modal */}
          {showBillingModal && (
            <BillingModal
              cart={cart}
              totalAmount={totalCartPrice}
              onClose={() => setShowBillingModal(false)}
            />
          )}
        </>
      )}
    </main>
  );
}

export default Cart;
