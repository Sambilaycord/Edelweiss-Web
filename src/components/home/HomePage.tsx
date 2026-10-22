import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../common/Navbar';
import HeroCarousel from './HeroCarousel';
import PromoCarousel from './PromoCarousel';
import FlashSale from './FlashSale';
import CategoryGrid from './CategoryGrid';
import FeaturedProducts from './FeaturedProducts';
import type { Product } from './FeaturedProducts';

const PAGE_SIZE = 10;

interface ProductRow {
	id: string | number;
	name: string;
	description: string | null;
	price: number | string;
	image_urls: string[] | null;
	average_rating?: number | null;
	review_count?: number | null;
}

const fetchProductPage = async (start: number): Promise<Product[]> => {
	const { data, error } = await supabase
		.from('products')
		.select('*')
		.eq('is_active', true)
		.order('created_at', { ascending: false })
		.range(start, start + PAGE_SIZE - 1); // inclusive range

	if (error) throw error;

	return ((data ?? []) as ProductRow[]).map((p) => ({
		id: p.id,
		name: p.name,
		desc: p.description ?? '',
		price: Number(p.price),
		image: p.image_urls?.[0] || '',
		average_rating: p.average_rating ?? undefined,
		review_count: p.review_count ?? undefined
	}));
};

const HomePage: React.FC = () => {
	const [products, setProducts] = useState<Product[]>([]);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);

	// Refs guard against duplicate "load more" requests and updates after unmount
	const loadingMoreRef = useRef(false);
	const productCountRef = useRef(0);
	const mountedRef = useRef(true);

	useEffect(() => {
		productCountRef.current = products.length;
	}, [products.length]);

	useEffect(() => {
		mountedRef.current = true;
		let cancelled = false;

		fetchProductPage(0)
			.then((items) => {
				if (cancelled) return;
				setProducts(items);
				// If we got fewer than a full page, there are no more to fetch
				setHasMore(items.length === PAGE_SIZE);
			})
			.catch((err: unknown) => {
				if (!cancelled) console.error('Error fetching products:', err);
			});

		return () => {
			cancelled = true;
			mountedRef.current = false;
		};
	}, []);

	const handleLoadMore = useCallback(async () => {
		if (loadingMoreRef.current || !hasMore) return;
		loadingMoreRef.current = true;
		setLoadingMore(true);

		try {
			const items = await fetchProductPage(productCountRef.current);
			if (!mountedRef.current) return;

			setProducts(prev => {
				// Skip any rows already shown (offset pagination can shift if new products are added)
				const seen = new Set(prev.map(p => p.id));
				return [...prev, ...items.filter(p => !seen.has(p.id))];
			});
			if (items.length < PAGE_SIZE) setHasMore(false);
		} catch (err: unknown) {
			console.error('Error fetching products:', err);
		} finally {
			loadingMoreRef.current = false;
			if (mountedRef.current) setLoadingMore(false);
		}
	}, [hasMore]);

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
				<FlashSale products={products.slice(0, 10)} />
				<FeaturedProducts
					products={products}
					onLoadMore={handleLoadMore}
					hasMore={hasMore}
					isLoadingMore={loadingMore}
				/>


			</main>
		</motion.div>
	);
};

export default HomePage;

