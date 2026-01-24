import React, { useState} from 'react';
import logo from '../../assets/logo.png';
import text_logo from '../../assets/edelweiss.png';
import { ShoppingCart, User, Bell, Search} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import HeroCarousel from './HeroCarousel';
import PromoCarousel from './PromoCarousel';
import FlashSale from './FlashSale';
import CategoryGrid from './CategoryGrid';

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
];

const HomePage: React.FC = () => {
	const [cartCount, setCartCount] = useState(0);

		const handleUserClick = async () => {
			try {
				const res = await supabase.auth.getUser();
				const user = (res && (res as any).data && (res as any).data.user) || null;
				if (!user) {
					window.location.href = '/login';
				} else {
					window.location.href = '/profile';
				}
			} catch (err) {
				window.location.href = '/login';
			}
		};

	const addToCart = (p: Product) => {
		setCartCount((c) => c + 1);
	};

	return (
		<div className="min-h-screen">
			<div className="text-sm text-gray-700">
				<div className="max-w-6xl mx-auto flex justify-end gap-4 py-2 px-6">
					<a href="/about" className="hover:text-pink-600">About</a>
					<a href="/contact" className="hover:text-pink-600">Contact</a>
					<div className="flex items-center gap-2"> 
						<a href="/login" className="hover:text-pink-600">Log in</a>
						<span className="text-gray-400">|</span>
						<a href="/signup" className="hover:text-pink-600">Sign up</a>
					</div>
				</div>
			</div>
			<header className="sticky top-0 bg-white/95 backdrop-blur z-40 shadow-sm">
				<div className="max-w-6xl mx-auto flex items-center justify-between py-4 px-6">
					
					{/* Left: Logo */}
					<div className="flex items-center gap-4">
						<img src={logo} alt="logo" className="w-12 h-12 object-contain" />
						<img src={text_logo} alt="Edelweiss" className="h-6 object-contain" />
					</div>

					{/* Center: Search Bar (Added) */}
					{/* hidden md:flex ensures it only shows on medium screens and up */}
					<div className="hidden md:flex flex-1 max-w-xl mx-6">
						<div className="relative w-full">
							<input 
								type="text" 
								placeholder="Search..." 
								className="w-full pl-4 pr-10 py-2 border border-pink-600 rounded-md text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
							/>
							<button className="absolute right-0 top-0 h-full px-3 text-pink-600 hover:text-pink-200 transition-colors">
								<Search className="w-5 h-5" />
							</button>
						</div>
					</div>

					{/* Right: Icons */}
					<div className="flex items-center gap-4">
						<div className="relative flex items-center gap-3">
							<button aria-label="Open cart" className="p-2 text-pink-600 hover:bg-pink-50 rounded-full flex items-center justify-center cursor-pointer">
								<ShoppingCart className="w-6 h-6" />
							</button>
							{cartCount > 0 && (
								<span className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
									{cartCount}
								</span>
							)}
							<button aria-label="Notifications" onClick={handleUserClick} className="p-2 text-pink-600 rounded-full cursor-pointer hover:bg-pink-50">
								<Bell className="w-6 h-6" />
							</button>
							<button aria-label="Account" onClick={handleUserClick} className="p-2 text-pink-600 rounded-full cursor-pointer hover:bg-pink-50">
								<User className="w-6 h-6" />
							</button>
						</div>
					</div>

				</div>
			</header>

			<main className="max-w-6xl mx-auto pt-6">
				<HeroCarousel />
				<PromoCarousel />
				<CategoryGrid />
				<FlashSale />
				

				<section id="products">
					<h2 className="text-2xl font-semibold mb-4">Featured products</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
						{sampleProducts.map((p) => (
							<div key={p.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
								<div className="h-40 bg-gray-100 rounded-md mb-4 flex items-center justify-center">Image</div>
								<h3 className="font-semibold text-lg">{p.name}</h3>
								<p className="text-sm text-gray-600 flex-1">{p.desc}</p>
								<div className="mt-4 flex items-center justify-between">
									<div className="text-lg font-bold">${p.price.toFixed(2)}</div>
									<button
										onClick={() => addToCart(p)}
										className="px-3 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
									>
										Add to cart
									</button>
								</div>
							</div>
						))}
					</div>
				</section>
			</main>
		</div>
	);
};

export default HomePage;

