// Cart.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cart</h1>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">Cart Item 1</h2>
        <p>Description of the item</p>
        <p className="font-semibold">Price: $10</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold mb-2">Cart Item 2</h2>
        <p>Description of the item</p>
        <p className="font-semibold">Price: $20</p>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-xl font-bold">Total: $30</span>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => navigate("/billing")}
        >
          Go to Billing
        </button>
      </div>
    </div>
  );
};

export default Cart;
