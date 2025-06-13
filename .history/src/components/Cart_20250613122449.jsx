import React from 'react';
import { Trash2 } from 'lucide-react'; // Ensure lucide-react is imported

function Cart({ cart, products, updateQuantity, removeFromCart }) {
  // Function to get the product image URL based on productId
  const getImageUrl = (productId) => {
    const product = products.find((p) => p.id === productId);
    // Provide a placeholder image if no product is found or image URL is missing
    return product?.imageUrl || 'https://placehold.co/80x80/CCCCCC/333333?text=Item';
  };

  // Calculate the total price of items in the cart
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="w-full bg-white p-8 rounded-xl shadow-2xl border border-gray-100 font-inter">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Shopping Cart</h2>
      {cart.length === 0 ? (
        <p className="text-gray-600 text-center text-lg py-8">Your cart is empty. Add some products from the left!</p>
      ) : (
        <>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.productId} className="flex flex-col sm:flex-row items-center justify-between p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition duration-200">
                <div className="flex items-center mb-4 sm:mb-0">
                  <img
                    src={getImageUrl(item.productId)}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg mr-4 border border-gray-300"
                    onError={(e) => {
                      // Fallback in case image fails to load
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/80x80/CCCCCC/333333?text=Item';
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-gray-600">Ksh{item.price.toFixed(2)} each</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                  {/* Quantity update buttons */}
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200 text-lg font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold text-gray-800 w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-200 text-lg font-bold"
                  >
                    +
                  </button>
                </div>
                {/* Remove from cart button */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-red-500 hover:text-red-700 transition duration-200 rounded-full hover:bg-red-100"
                  aria-label="Remove item from cart"
                >
                  <Trash2 size={24} /> {/* Adjust icon size for better visibility */}
                </button>
              </div>
            ))}
          </div>
          <div className="text-right mt-6 text-2xl font-bold text-blue-700 p-4 border-t-2 border-blue-100">
            Total: Ksh{totalCartPrice.toFixed(2)}
          </div>
        </>
      )}
    </main>
  );
}

export default Cart;
