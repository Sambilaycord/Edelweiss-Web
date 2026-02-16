import React, { useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import Navbar from '../common/Navbar';
import HeroCarousel from './HeroCarousel';
import PromoCarousel from './PromoCarousel';
import FlashSale from './FlashSale';
import CategoryGrid from './CategoryGrid';
import FeaturedProducts from './FeaturedProducts';

type Product = {
	id: number;
	name: string;
	price: number;
	desc?: string;
};

const sampleProducts: Product[] = [
	{ id: 1, name: 'Edelweiss Candle', price: 12.99, desc: 'Hand-poured scented candle.' },
	{ id: 2, name: 'Edelweiss Mug', price: 9.5, desc: 'Ceramic mug with logo.' },
	{ id: 3, name: 'Edelweiss Tote', price: 14.0, desc: 'Canvas tote bag.' },
	{ id: 4, name: 'Edelweiss Notebook', price: 7.25, desc: 'Lined notebook, 80 pages.' },
	{ id: 5, name: 'Edelweiss Sticker Pack', price: 4.5, desc: 'Set of 6 stickers.' },
	{ id: 6, name: 'Edelweiss Tee', price: 19.99, desc: 'Soft cotton t-shirt.' },
	{ id: 7, name: 'Edelweiss Tee', price: 19.99, desc: 'Soft cotton t-shirt.' },
	{ id: 8, name: 'Edelweiss Tee', price: 19.99, desc: 'Soft cotton t-shirt.' },
	{ id: 9, name: 'Edelweiss Tee', price: 19.99, desc: 'Soft cotton t-shirt.' },
	{ id: 10, name: 'Edelweiss Tee', price: 19.99, desc: 'Soft cotton t-shirt.' },
	{ id: 11, name: 'Edelweiss Tee', price: 19.99, desc: 'Soft cotton t-shirt.' },
	{ id: 12, name: 'Edelweiss Tee', price: 19.99, desc: 'Soft cotton t-shirt.' },
];

const HomePage: React.FC = () => {
	const [cartCount, setCartCount] = useState(0);

	const addToCart = (p: Product) => {
		setCartCount((c) => c + 1);
	};

	return (
		<motion.div 
            initial={{ opacity: 0 }}       // Starts invisible
            animate={{ opacity: 1 }}       // Fades in to visible
            exit={{ opacity: 0 }}          // Fades out when leaving
            transition={{ duration: 0.5 }} // Smooth 0.5s transition
            className="min-h-screen"
        >
			<Navbar cartCount={cartCount} />

			<main className="max-w-7/10 mx-auto pt-6">
				<HeroCarousel />
				<PromoCarousel />
				<CategoryGrid />
				<FlashSale />
				<FeaturedProducts products={sampleProducts} onAddToCart={addToCart} />


			</main>
		</motion.div>
	);
};

export default HomePage;

