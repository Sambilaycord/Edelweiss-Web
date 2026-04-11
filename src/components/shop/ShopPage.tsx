import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Store, Search, Package, Image as ImageIcon, Star, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../common/Navbar';

interface ShopData {
    id: string;
    name: string;
    description: string;
    business_phone: string;
    shop_logo_url: string | null;
    shop_banner_url: string | null;
    shop_address: string | null;
    average_rating?: number;
    review_count?: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    image_urls: string[];
    is_active: boolean;
    average_rating?: number;
    review_count?: number;
    product_variants?: { price: number; stock: number }[];
}

const ShopPage: React.FC = () => {
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState<ShopData | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchShopAndProducts = async () => {
            if (!shopId) return;

            setLoading(true);
            try {
                // Fetch Shop Info
                const { data: shopData, error: shopError } = await supabase
                    .from('shops')
                    .select('*')
                    .eq('id', shopId)
                    .single();

                if (shopError || !shopData) {
                    console.error('Shop not found');
                    navigate('/'); // or show 404
                    return;
                }
                setShop(shopData);

                // Fetch Products for this shop
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*, product_variants(price, stock)')
                    .eq('shop_id', shopId)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (!productsError && productsData) {
                    setProducts(productsData);
                }
            } catch (err) {
                console.error('Failed to load shop:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchShopAndProducts();
    }, [shopId, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-pink-50/30 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!shop) return null;

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            {/* ===== BANNER & HEADER ===== */}
            <div className="relative">
                {/* Banner Image */}
                <div className="max-w-7xl mx-auto h-64 md:h-80 bg-gradient-to-r from-pink-200 to-rose-200 overflow-hidden">
                    {shop.shop_banner_url ? (
                        <img
                            src={shop.shop_banner_url}
                            alt={`${shop.name} banner`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                            <Store size={120} className="text-pink-600" />
                        </div>
                    )}
                </div>

                {/* Shop Info Card (Overlapping Banner) */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 mb-12 relative z-10">
                    <div className="bg-white rounded-3xl shadow-md p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center">
                        {/* Logo */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-white shadow-lg bg-white overflow-hidden flex-shrink-0 -mt-20 md:-mt-0 relative z-20">
                            {shop.shop_logo_url ? (
                                <img
                                    src={shop.shop_logo_url}
                                    alt={`${shop.name} logo`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-pink-50 flex items-center justify-center text-pink-300">
                                    <Store size={48} />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4 flex-wrap">
                                    <h1 className="text-3xl md:text-4xl font-medium text-gray-900">
                                        {shop.name}
                                    </h1>
                                    {shop.review_count !== undefined && shop.review_count > 0 ? (
                                        <div className="flex items-center gap-1 font-bold text-gray-900 text-lg md:text-xl bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                                            <span>{Number(shop.average_rating || 0).toFixed(1)}</span>
                                            <Star size={18} className="text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                                            <span className="text-sm text-gray-500 font-medium ml-1">({shop.review_count})</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 font-medium text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                            New Shop
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-600 mb-4 max-w-5xl text-sm md:text-base leading-relaxed text-justify">
                                    {shop.description || 'Welcome to our shop! Feel free to browse our products.'}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto border-t border-gray-50">
                                <div className="flex flex-wrap gap-2 text-sm font-medium text-gray-500">
                                    {shop.shop_address && (
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-2 rounded-xl">
                                            <MapPin size={16} className="text-pink-500" />
                                            {shop.shop_address}
                                        </div>
                                    )}
                                </div>

                                <button className="self-start sm:self-auto bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-sm transition-colors text-sm hover:shadow-md cursor-pointer flex items-center gap-2">
                                    <MessageCircle size={18} /> Message Shop
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== PRODUCT CATALOG ===== */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">Our Products</h2>
                    <div className="relative w-full md:w-72 shadow-sm rounded-xl overflow-hidden">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search this shop..."
                            className="w-full pl-11 pr-4 py-3 border-none bg-white text-sm outline-none focus:ring-2 focus:ring-pink-400 transition-shadow"
                        />
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm text-center py-20 px-6 border border-gray-100">
                        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-400">
                            <Package size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No products available</h3>
                        <p className="text-gray-500">This shop hasn't listed any items publicly yet. Check back soon!</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p>No products match your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        <AnimatePresence>
                            {filteredProducts.map((product) => (
                                <CustomerProductCard key={product.id} product={product} />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
};

/* ===== CUSTOMER PRODUCT CARD ===== */
const CustomerProductCard = ({ product }: { product: Product }) => {
    const hasVariants = product.product_variants && product.product_variants.length > 0;
    const isOutOfStock = !hasVariants && product.stock <= 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all cursor-pointer flex flex-col h-full ${isOutOfStock ? 'opacity-70 grayscale-[0.3]' : ''}`}
            onClick={() => {
                // Navigate to public product details page (to be implemented)
                console.log('Navigate to product', product.id);
            }}
        >
            {/* Image */}
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {product.image_urls && product.image_urls.length > 0 ? (
                    <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <ImageIcon size={40} className="mb-2" />
                    </div>
                )}

                {/* Stock Badges */}
                {isOutOfStock ? (
                    <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-sm px-3 py-1 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm">
                        Sold Out
                    </div>
                ) : null}
            </div>

            {/* Info */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2 md:text-base group-hover:text-pink-600 transition-colors">
                    {product.name}
                </h3>
                {product.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                        {product.description}
                    </p>
                )}

                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-pink-600 font-medium text-base md:text-lg">
                        {hasVariants && <span className="text-gray-400 font-medium text-xs mr-1">from</span>}
                        ₱{Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>

                    {product.review_count !== undefined && product.review_count > 0 && (
                        <div className="flex items-center gap-1 text-xs bg-yellow-50 px-2 py-1 rounded-lg text-gray-800 font-bold border border-yellow-100">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span>{Number(product.average_rating || 0).toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default ShopPage;
