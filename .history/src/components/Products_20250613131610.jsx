// Products.jsx
import React from 'react';

const productList = [
  { id: '1', name: 'Wireless Headphones', price: 1, imageUrl: 'https://placehold.co/200x200/CAF0F8/03045E?text=Headphones', description: 'Experience immersive sound with these comfortable wireless headphones.' },
  { id: '2', name: 'Smartwatch', price: 1.5, imageUrl: 'https://placehold.co/200x200/ADE8F4/03045E?text=Smartwatch', description: 'Track your fitness and stay connected with this sleek smartwatch.' },
  { id: '3', name: 'Portable Bluetooth Speaker', price: 49.99, imageUrl: 'https://placehold.co/200x200/90E0EF/03045E?text=Speaker', description: 'Powerful sound in a compact design, perfect for on-the-go.' },
  { id: '4', name: 'Laptop Stand', price: 29.99, imageUrl: 'https://placehold.co/200x200/48CAE4/03045E?text=Stand', description: 'Ergonomic design to elevate your laptop for better posture.' },
  { id: '5', name: 'External SSD 1TB', price: 119.99, imageUrl: 'https://placehold.co/200x200/00B4D8/03045E?text=SSD', description: 'Fast and reliable storage for all your files and backups.' },
];

function Products({ addToCart }) {
  return (
    <main className="w-full max-w-5xl bg-white p-8 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Our Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {productList.map((product) => (
          <div key={product.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl bg-white p-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/200x200/CCCCCC/333333?text=Image+Not+Found';
              }}
            />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-blue-600">Ksh{product.price.toFixed(2)}</span>
              <button
                onClick={() => addToCart(product)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// Export both component and product list
Products.productList = productList;

export default Products;
