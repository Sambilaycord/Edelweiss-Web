import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// 1. Define the shape of a single Product
export interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  image?: string;
}

// 2. Define the props
interface FeaturedProductsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products, onAddToCart }) => {
  // STATE: Control how many products are visible
  // Initial: 8 products (2 rows on desktop)
  const [visibleCount, setVisibleCount] = useState(8);

  // HANDLER: Increase the visible count by 4 (1 row on desktop)
  const handleSeeMore = () => {
    setVisibleCount((prevCount) => prevCount + 4);
  };

  return (
    <section id="products" className="py-8 max-w-[1400px] mx-auto px-4">
      <h2 className="text-2xl font-semibold mb-6 font-serif text-gray-800">
        Featured products
      </h2>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* SLICE: Only map the products up to the visibleCount */}
        {products.slice(0, visibleCount).map((p) => (
          <div 
            key={p.id} 
            className="group bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 p-4 flex flex-col"
          >
            {/* Image Placeholder */}
            <div className="h-40 bg-gray-100 rounded-md mb-4 flex items-center justify-center text-gray-400 overflow-hidden relative">
              {p.image ? (
                <img 
                  src={p.image} 
                  alt={p.name} 
                  className="h-full w-full object-cover rounded-md group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <span className="text-sm">Image</span>
              )}
            </div>

            <h3 className="font-semibold text-lg mb-1 text-gray-900">{p.name}</h3>
            <p className="text-sm text-gray-500 flex-1 mb-4 line-clamp-2">{p.desc}</p>
            
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="text-lg font-bold text-pink-600">
                ${p.price.toFixed(2)}
              </div>
              
              <button
                onClick={() => onAddToCart(p)}
                className="px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-full hover:bg-pink-600 hover:shadow-md transition-all active:scale-95"
              >
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* "See More" Button Area */}
      {/* CONDITION: Only show if there are more products to show */}
      {visibleCount < products.length && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleSeeMore}
            className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 hover:border-pink-300 hover:text-pink-600 transition-all duration-300 shadow-sm"
          >
            See More Products
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;