import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);

	const fetchProducts = async (isInitial = true) => {
		if (isInitial) setLoading(true);
		else setLoadingMore(true);

		try {
			const start = isInitial ? 0 : products.length;
			const end = start + 9; // Fetch 10 products (inclusive)

			const { data, error } = await supabase
				.from('products')
				.select('*')
				.eq('is_active', true)
				.order('created_at', { ascending: false })
				.range(start, end);

			if (error) throw error;

			if (data) {
				const mappedProducts = data.map((p: any) => ({
					id: p.id,
					name: p.name,
					desc: p.description,
					price: Number(p.price),
					image: p.image_urls?.[0] || '',
					average_rating: p.average_rating,
					review_count: p.review_count
				}));

				if (isInitial) {
					setProducts(mappedProducts);
				} else {
					setProducts(prev => [...prev, ...mappedProducts]);
				}

				// If we got fewer than 10 products, there are no more to fetch
				if (data.length < 10) {
					setHasMore(false);
				}
			}
		} catch (err) {
			console.error('Error fetching products:', err);
		} finally {
			if (isInitial) setLoading(false);
			else setLoadingMore(false);
		}
	};

	useEffect(() => {
		fetchProducts(true);
	}, []);

	const handleLoadMore = () => {
		if (!loadingMore && hasMore) {
			fetchProducts(false);
		}
	};

	const addToCart = async (p: Product) => {
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			navigate('/login');
			return;
		}

		try {
			let cartId = null;
			const { data: existingCart } = await supabase
				.from('carts')
				.select('id')
				.eq('customer_id', user.id)
				.maybeSingle();

			if (existingCart) {
				cartId = existingCart.id;
			} else {
				const { data: newCart, error: newCartError } = await supabase
					.from('carts')
					.insert({ customer_id: user.id })
					.select('id')
					.single();

				if (newCartError) throw newCartError;
				cartId = newCart?.id;
			}

			if (!cartId) return;

			const { data: existingItem } = await supabase
				.from('cart_items')
				.select('id, quantity')
				.eq('cart_id', cartId)
				.eq('product_id', p.id)
				.is('variant_id', null)
				.maybeSingle();

			if (existingItem) {
				await supabase
					.from('cart_items')
					.update({ quantity: existingItem.quantity + 1 })
					.eq('id', existingItem.id);
			} else {
				await supabase
					.from('cart_items')
					.insert({
						cart_id: cartId,
						product_id: p.id,
						quantity: 1,
						variant_id: null
					});
			}
		} catch (error) {
			console.error("Error adding to cart from home:", error);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}       // Starts invisible
			animate={{ opacity: 1 }}       // Fades in to visible
			exit={{ opacity: 0 }}          // Fades out when leaving
			transition={{ duration: 0.5 }} // Smooth 0.5s transition
			className="min-h-screen"
		>
			<Navbar />

			<main className="max-w-7/10 mx-auto pt-6">
				<HeroCarousel />
				<PromoCarousel />
				<CategoryGrid />
				<FlashSale products={products.slice(0, 10)} onAddToCart={addToCart} />
				<FeaturedProducts
					products={products}
					onAddToCart={addToCart}
					onLoadMore={handleLoadMore}
					hasMore={hasMore}
					isLoadingMore={loadingMore}
				/>


			</main>
		</motion.div>
	);
};

export default HomePage;

