import React, { useState } from 'react';
import { Grid, X } from 'lucide-react';

import bouquetImg from '../../assets/product_categories/bouquet.jpg';
import stemsImg from '../../assets/product_categories/single_rose.png';
import vaseImg from '../../assets/product_categories/vase_arrangements.jpg';
import boxesImg from '../../assets/product_categories/flower_box.jpg';
import basketImg from '../../assets/product_categories/flower_basket.jpg';
import driedImg from '../../assets/product_categories/dried_flowers.jpg';
import funeralImg from '../../assets/product_categories/funeral_flowers.jpg';
import crochetImg from '../../assets/product_categories/crochet_flowers.png';
import artificialImg from '../../assets/product_categories/artificial_flowers.jpg';


const CategoryCircles = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    { id: 1, name: "Bouquets", image: bouquetImg },
    { id: 2, name: "Single Stems", image: stemsImg },
    { id: 3, name: "Vase Arrangements", image: vaseImg },
    { id: 4, name: "Flower Boxes", image: boxesImg },
    { id: 5, name: "Baskets", image: basketImg },
    { id: 6, name: "Dried Flowers", image: driedImg },
    { id: 7, name: "Funeral Flowers", image: funeralImg },
    { id: 8, name: "Crocheted Flowers", image: crochetImg },
    { id: 9, name: "Artificial Flowers", image: artificialImg },
  ];

  return (
    <section className="relative py-4 mt-8 mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 font-serif">
        Shop by Category
      </h2>
      <div className="flex items-start justify-center gap-4 md:gap-8 overflow-x-auto scrollbar-hide p-2">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href="#"
            className="group flex flex-col items-center flex-shrink-0 w-[calc((100%-64px)/5)] sm:w-[calc((100%-80px)/6)] md:w-[calc((100%-288px)/10)] gap-4 transition-transform duration-300 hover:scale-105"
          >
            <div className="aspect-square w-full rounded-full overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-pink-300 transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-pink-100/50">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <span className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 text-center leading-tight group-hover:text-pink-600 transition-colors line-clamp-2">
              {cat.name}
            </span>
          </a>
        ))}
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex flex-col items-center flex-shrink-0 w-[calc((100%-64px)/5)] sm:w-[calc((100%-80px)/6)] md:w-[calc((100%-288px)/10)] gap-4 transition-transform duration-300 hover:scale-105 cursor-pointer"
        >
          <div className="aspect-square w-full rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-lg group-hover:shadow-pink-200/50">
            <Grid className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </div>

          <span className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-900 text-center group-hover:text-pink-600 transition-colors">
            All <br /> Categories
          </span>
        </button>

      </div>

      {/* All Categories Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">Explore Categories</h2>
                <p className="text-gray-500 text-sm md:text-base mt-1">Find the perfect arrangement for any occasion</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 hover:bg-gray-100 rounded-full transition-all cursor-pointer group"
              >
                <X size={24} className="text-gray-400 group-hover:text-pink-600 transition-colors" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar bg-gray-50/30">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {categories.map((cat) => (
                  <a
                    key={cat.id}
                    href="#"
                    className="group flex flex-col items-center bg-white p-4 rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-300"
                  >
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-50 mb-4 border-2 border-transparent group-hover:border-pink-100 transition-all duration-500">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <span className="text-sm md:text-base font-bold text-gray-800 text-center group-hover:text-pink-600 transition-colors">
                      {cat.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-white text-center">
              <p className="text-gray-400 text-xs md:text-sm font-medium italic">
                Showing all flower categories. More coming soon!
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CategoryCircles;
