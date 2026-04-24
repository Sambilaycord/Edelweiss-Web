import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../common/Navbar';
import HeroCarousel from './HeroCarousel';
import PromoCarousel from './PromoCarousel';
import FlashSale from './FlashSale';
import CategoryGrid from './CategoryGrid';
import FeaturedProducts from './FeaturedProducts';
import type { Product } from './FeaturedProducts';

const HomePage: React.FC = () => {
	const [cartCount, setCartCount] = useState(0);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			try {
				const { data, error } = await supabase
					.from('products')
					.select('*')
					.eq('is_active', true)
					.limit(12);

				if (error) throw error;

				if (data) {
					const mappedProducts = data.map((p: any) => ({
						id: p.id,
						name: p.name,
						desc: p.description,
						price: Number(p.price),
						image: p.image_urls?.[0] || ''
					}));
					setProducts(mappedProducts);
				}
			} catch (err) {
				console.error('Error fetching products:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, []);

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
				<FeaturedProducts products={products} onAddToCart={addToCart} />


			</main>
		</motion.div>
	);
};

export default HomePage;

