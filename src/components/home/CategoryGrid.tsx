import React from 'react';
import { Grid, ArrowRight } from 'lucide-react';

const CategoryCircles = () => {
  // Top 7 Categories
  const categories = [
    { id: 1, name: "Fresh Bouquets", placeholder: "Bouquet" },
    { id: 2, name: "Crochet Flowers", placeholder: "Crochet" },
    { id: 3, name: "Stuffed Toys", placeholder: "Toys" },
    { id: 4, name: "Flower Boxes", placeholder: "Boxes" },
    { id: 5, name: "Dried Flowers", placeholder: "Dried" },
    { id: 6, name: "Vase Sets", placeholder: "Vases" },
    { id: 7, name: "Chocolates", placeholder: "Choco" },
    { id: 8, name: "Chocolates", placeholder: "Choco" },
  ];

  return (
    <section className="py-8 max-w-[1400px] mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 font-serif">
        Shop by Category
      </h2>

      {/* Layout:
        - flex: Aligns items in a row
        - gap-4 md:gap-8: Adds space between the floating circles (tighter on mobile, wider on desktop)
        - overflow-x-auto: Enables horizontal scrolling
      */}
      <div className="flex items-start gap-4 md:gap-8 overflow-x-auto scrollbar-hide p-2">
        
        {/* 1. Map through the first 7 categories */}
        {categories.map((cat) => (
          <a 
            key={cat.id} 
            href="#" 
            className="group flex flex-col items-center flex-shrink-0 w-20 md:w-24 gap-4"
          >
            {/* Circular Image Placeholder 
                - rounded-full: Makes it a perfect circle
                - hover:ring: Adds a pink ring when hovered (like Instagram)
            */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-pink-500 group-hover:ring-2 group-hover:ring-pink-500 group-hover:ring-offset-2 transition-all duration-300 shadow-sm">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide">
                {cat.placeholder}
              </span>
            </div>

            {/* Label (Bottom) */}
            <span className="text-xs md:text-sm font-medium text-gray-700 text-center leading-tight group-hover:text-pink-600 transition-colors line-clamp-2">
              {cat.name}
            </span>
          </a>
        ))}

        {/* 2. The "More Categories" Button (Always at the end) */}
        <a 
          href="/categories" 
          className="group flex flex-col items-center flex-shrink-0 w-20 md:w-24 gap-3"
        >
          {/* Circle styling specific for the 'More' button */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 group-hover:bg-pink-600 group-hover:text-white group-hover:ring-2 group-hover:ring-pink-600 group-hover:ring-offset-2 transition-all duration-300 shadow-sm border border-pink-100">
            <Grid className="w-6 h-6 md:w-8 md:h-8" />
          </div>

          <span className="text-xs md:text-sm font-semibold text-gray-900 text-center group-hover:text-pink-600 transition-colors">
            More <br/> Categories
          </span>
        </a>

      </div>
    </section>
  );
};

export default CategoryCircles;