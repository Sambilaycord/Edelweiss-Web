import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../common/Navbar';
import { ArrowLeft, Star, ShoppingBag, Plus, Minus, Store, Loader2, ChevronLeft, ChevronRight, Heart, MessageCircle, Image as ImageIcon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddReminderModal from '../notification/AddReminderModal';
import ReminderSelectionModal from '../notification/ReminderSelectionModal';

interface Variant {
    id: string;
    name: string;
    price: number;
    stock: number;
}

interface ShopData {
    id: string;
    name: string;
    shop_logo_url: string | null;
    owner_id: string;
    is_vacation?: boolean;
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
    shop_id: string;
    product_variants?: Variant[];
    shops?: ShopData; // Supabase joined mapping
}

const ProductPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<Product | null>(null);

    // UI State
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
    const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
    const [quantity, setQuantity] = useState(1);

    const [addingToCart, setAddingToCart] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteId, setFavoriteId] = useState<string | null>(null);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [showSelectionModal, setShowSelectionModal] = useState(false);

    useEffect(() => {
        const fetchProductData = async () => {
            if (!productId) return;
            setLoading(true);
            setProduct(null);
            setIsFavorite(false);
            setFavoriteId(null);
            setQuantity(1);
            setSelectedVariant(null);
            setSelectedImage('');

            try {
                // Fetch product alongside its variants and shop info
                const { data, error } = await supabase
                    .from('products')
                    .select(`
                        *,
                        product_variants (id, name, price, stock),
                        shops (id, name, shop_logo_url, owner_id, is_vacation)
                    `)
                    .eq('id', productId)
                    .single();

                if (error || !data) {
                    console.error('Product not found or error loading.');
                    navigate('/'); // Better redirect might be to a global shop page or 404
                    return;
                }

                setProduct(data);

                // Initialize default selections
                if (data.image_urls && data.image_urls.length > 0) {
                    setSelectedImage(data.image_urls[0]);
                }

                // If variants exist, auto-select the first active variant
                if (data.product_variants && data.product_variants.length > 0) {
                    // Sorting or choosing standard variant can be done here. We pick [0]
                    setSelectedVariant(data.product_variants[0]);
                }

                // Fetch Recommended Products
                const { data: recData, error: recError } = await supabase
                    .from('products')
                    .select('*, product_variants(price, stock)')
                    .eq('shop_id', data.shop_id)
                    .eq('is_active', true)
                    .neq('id', data.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (!recError && recData) {
                    setRecommendedProducts(recData);
                }

                // Check Favorite Status
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: favData } = await supabase
                        .from('user_favorites')
                        .select('id')
                        .eq('customer_id', user.id)
                        .eq('product_id', productId)
                        .maybeSingle();
                    
                    if (favData) {
                        setIsFavorite(true);
                        setFavoriteId(favData.id);
                    }
                }

            } catch (err) {
                console.error("Failed to load product page details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [productId, navigate]);

    // Active Display Logic
    const currentPrice = selectedVariant ? selectedVariant.price : (product?.price || 0);
    const maxStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0);
    const isOutOfStock = maxStock <= 0;

    // Realtime Presence State
    const [isShopOnline, setIsShopOnline] = useState(false);

    useEffect(() => {
        if (!product?.shops?.owner_id) return;
        const ownerId = product.shops.owner_id;

        const channel = supabase.channel('global_presence');

        channel.on('presence', { event: 'sync' }, () => {
            const newState = channel.presenceState();
            let online = false;
            for (const [, presences] of Object.entries(newState)) {
                for (const p of presences as any[]) {
                    if (p.user_id === ownerId) {
                        online = true;
                        break;
                    }
                }
            }
            setIsShopOnline(online);
        }).subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [product?.shops?.owner_id]);

    // Image Navigation Handlers
    const handlePrevImage = () => {
        if (!product?.image_urls) return;
        setSlideDirection('left');
        const currentIndex = product.image_urls.indexOf(selectedImage);
        if (currentIndex > 0) {
            setSelectedImage(product.image_urls[currentIndex - 1]);
        } else {
            setSelectedImage(product.image_urls[product.image_urls.length - 1]);
        }
    };

    const handleNextImage = () => {
        if (!product?.image_urls) return;
        setSlideDirection('right');
        const currentIndex = product.image_urls.indexOf(selectedImage);
        if (currentIndex < product.image_urls.length - 1) {
            setSelectedImage(product.image_urls[currentIndex + 1]);
        } else {
            setSelectedImage(product.image_urls[0]);
        }
    };

    const handleThumbnailClick = (img: string) => {
        if (!product?.image_urls || img === selectedImage) return;
        const currentIndex = product.image_urls.indexOf(selectedImage);
        const newIndex = product.image_urls.indexOf(img);
        setSlideDirection(newIndex > currentIndex ? 'right' : 'left');
        setSelectedImage(img);
    };

    // Auto-carousel effect
    useEffect(() => {
        if (!product?.image_urls || product.image_urls.length <= 1) return;

        const intervalId = setInterval(() => {
            setSlideDirection('right');
            const currentIndex = product.image_urls.indexOf(selectedImage);
            if (currentIndex !== -1 && currentIndex < product.image_urls.length - 1) {
                setSelectedImage(product.image_urls[currentIndex + 1]);
            } else {
                setSelectedImage(product.image_urls[0]);
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [product?.image_urls, selectedImage]);

    // Quantity Handlers
    const handleIncrement = () => {
        if (quantity < maxStock) setQuantity(prev => prev + 1);
    };
    const handleDecrement = () => {
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    const handleAddToCart = async () => {
        setMessage(null);

        const { data: { user } } = await supabase.auth.getUser();

        // Block 1: Redirect to login if unauthenticated
        if (!user) {
            navigate('/login');
            return;
        }

        if (!product || isOutOfStock) return;

        setAddingToCart(true);

        try {
            // Check for existing cart
            let cartId = null;
            const { data: existingCart } = await supabase
                .from('carts')
                .select('id')
                .eq('customer_id', user.id)
                .maybeSingle();

            if (existingCart) {
                cartId = existingCart.id;
            } else {
                // Create new cart
                const { data: newCart, error: newCartError } = await supabase
                    .from('carts')
                    .insert({ customer_id: user.id })
                    .select('id')
                    .single();

                if (newCartError) throw newCartError;
                cartId = newCart?.id;
            }

            if (!cartId) throw new Error("Could not initialize Cart.");

            // Check if product is already in cart items
            const { data: existingItem } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('cart_id', cartId)
                .eq('product_id', product.id)
                .eq('variant_id', selectedVariant?.id || null)
                .maybeSingle();

            if (existingItem) {
                // Update quantity
                // Note: Assuming Variant changes aren't tracked natively in `cart_items` for now.
                const newQuantity = existingItem.quantity + quantity;
                const { error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;
            } else {
                // Insert new item
                const { error: insertError } = await supabase
                    .from('cart_items')
                    .insert({
                        cart_id: cartId,
                        product_id: product.id,
                        quantity: quantity,
                        variant_id: selectedVariant?.id || null
                    });

                if (insertError) throw insertError;
            }

            setMessage({ text: 'Added to your bag!', type: 'success' });

        } catch (error) {
            console.error("Error adding to cart:", error);
            setMessage({ text: 'Failed to add item. Please try again.', type: 'error' });
        } finally {
            setAddingToCart(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        }
    };

    const handleToggleFavorite = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            if (isFavorite && favoriteId) {
                // Remove
                const { error } = await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('id', favoriteId);
                
                if (error) throw error;
                setIsFavorite(false);
                setFavoriteId(null);
                setMessage({ text: 'Removed from favorites', type: 'error' });
            } else {
                // Add
                const { data, error } = await supabase
                    .from('user_favorites')
                    .insert({
                        customer_id: user.id,
                        product_id: productId
                    })
                    .select('id')
                    .single();
                
                if (error) throw error;
                setIsFavorite(true);
                setFavoriteId(data.id);
                setMessage({ text: 'Added to favorites!', type: 'success' });
            }
        } catch (err) {
            console.error("Wishlist error:", err);
            setMessage({ text: 'Error updating wishlist', type: 'error' });
        } finally {
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-pink-600" size={40} />
                </div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
            <Navbar />

            {/* Breadcrumb Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors font-medium text-sm group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Shop
                </button>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 lg:p-10 mb-8 pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

                        {/* LEFT COLUMN: Image Gallery */}
                        <div className="flex flex-col gap-4">
                            {/* Main Display */}
                            <div className="bg-gray-50 rounded-3xl aspect-square w-full overflow-hidden border border-gray-100 relative group">
                                {selectedImage ? (
                                    <>
                                        <AnimatePresence initial={false} custom={slideDirection}>
                                            <motion.img
                                                key={selectedImage}
                                                custom={slideDirection}
                                                initial={(direction) => ({
                                                    x: direction === 'right' ? '100%' : '-100%',
                                                    opacity: 1
                                                })}
                                                animate={{ x: 0, opacity: 1 }}
                                                exit={(direction) => ({
                                                    x: direction === 'left' ? '100%' : '-100%',
                                                    opacity: 1
                                                })}
                                                transition={{ duration: 0.4, ease: 'easeInOut' }}
                                                src={selectedImage}
                                                alt={product.name}
                                                className="w-full h-full object-cover absolute top-0 left-0"
                                            />
                                        </AnimatePresence>

                                        {/* Image Navigation Arrows */}
                                        {product.image_urls && product.image_urls.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePrevImage}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-pink-600 focus:opacity-100 focus:outline-none z-10"
                                                    aria-label="Previous image"
                                                >
                                                    <ChevronLeft size={24} />
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-pink-600 focus:opacity-100 focus:outline-none z-10"
                                                    aria-label="Next image"
                                                >
                                                    <ChevronRight size={24} />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        No Image Available
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {product.image_urls && product.image_urls.length > 1 && (
                                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {product.image_urls.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleThumbnailClick(img)}
                                            className={`w-20 h-20 rounded-2xl flex-shrink-0 border-2 overflow-hidden transition-all ${selectedImage === img ? 'border-pink-500 shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        >
                                            <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Product Context */}
                        <div className="flex flex-col">

                            {/* Title & Rating */}
                            <div className="mb-6">
                                <h1 className="text-3xl md:text-5xl text-gray-900 mb-3 tracking-tight">
                                    {product.name}
                                </h1>
                                <div className="flex items-center gap-4 flex-wrap">
                                    {product.review_count !== undefined && product.review_count > 0 ? (
                                        <div className="flex items-center gap-1 font-medium text-gray-900 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100 cursor-pointer">
                                            <span>{Number(product.average_rating || 0).toFixed(1)}</span>
                                            <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                            <span className="text-sm text-gray-500 ml-1">({product.review_count} Reviews)</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 font-medium text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                            New Release
                                        </div>
                                    )}

                                    {/* Shop Banner Minified */}
                                    {product.shops && (
                                        <button
                                            onClick={() => navigate(`/shop/${product.shop_id}`)}
                                            className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1 rounded-full transition-colors border border-transparent hover:border-gray-100"
                                        >
                                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shadow-sm">
                                                {product.shops.shop_logo_url ? (
                                                    <img src={product.shops.shop_logo_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Store size={12} className="text-pink-300" />
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 hover:text-pink-600">{product.shops.name}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-8">
                                <p className="text-4xl text-pink-600 font-medium relative inline-block">
                                    <span className="text-2xl font-semibold mr-1 align-top text-pink-400">₱</span>
                                    {Number(currentPrice).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </p>
                            </div>

                            <hr className="border-gray-100 mb-8" />

                            {/* Description */}
                            <div className="mb-10 text-gray-600 leading-relaxed max-w-prose text-sm md:text-base">
                                {product.description || 'No description provided for this catalog.'}
                            </div>

                            {/* Variant Selector */}
                            {product.product_variants && product.product_variants.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-widest mb-3">
                                        Select Option
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {product.product_variants.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => {
                                                    setSelectedVariant(v);
                                                    if (quantity > v.stock) setQuantity(Math.max(1, v.stock));
                                                }}
                                                className={`px-5 py-3 rounded-2xl border-2 font-medium text-sm transition-all focus:outline-none ${selectedVariant?.id === v.id
                                                    ? 'border-pink-600 bg-pink-50 text-pink-700 shadow-sm'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                {v.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stock Indicator */}
                            <div className="mb-8 flex items-center gap-2 font-medium">
                                <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                {isOutOfStock ? (
                                    <span className="text-red-600 font-bold">Sold Out</span>
                                ) : (
                                    <span className="text-green-700">{maxStock} left in stock</span>
                                )}
                            </div>

                            <div className="mt-auto flex flex-col">
                                {/* Live Notification Feedback */}
                                <AnimatePresence>
                                    {message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`mb-4 px-4 py-3 rounded-xl font-medium text-sm shadow-sm border flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                                }`}
                                        >
                                            {message.text}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action Bar (Quantity + Cart) */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Quantity Toggler */}
                                    <div className={`flex items-center justify-between border-2 border-gray-200 rounded-2xl h-14 w-full sm:w-36 bg-white overflow-hidden transition-opacity ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <button
                                            onClick={handleDecrement}
                                            disabled={quantity <= 1}
                                            className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="font-medium text-gray-900 text-lg select-none">
                                            {quantity}
                                        </span>
                                        <button
                                            onClick={handleIncrement}
                                            disabled={quantity >= maxStock}
                                            className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 transition-colors"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>

                                    {/* Add to Cart Button */}
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock || addingToCart}
                                        className={`flex-1 h-14 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-md ${isOutOfStock
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                            : 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden'
                                            }`}
                                    >
                                        {addingToCart ? (
                                            <Loader2 className="animate-spin" size={22} />
                                        ) : (
                                            <>
                                                <ShoppingBag size={22} />
                                                {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
                                            </>
                                        )}
                                    </button>

                                    {/* Wishlist Button */}
                                    <button
                                        onClick={handleToggleFavorite}
                                        className={`h-14 w-14 sm:w-16 flex items-center justify-center transition-all focus:outline-none hover:scale-110 active:scale-95 flex-shrink-0 ${isFavorite
                                            ? 'text-pink-500'
                                            : 'text-pink-500 hover:text-pink-600'
                                            }`}
                                        aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
                                    >
                                        <Heart size={42} className={isFavorite ? "fill-pink-500" : ""} />
                                    </button>

                                    {/* Remind Me Later Button */}
                                    <button
                                        onClick={() => setShowSelectionModal(true)}
                                        className="h-14 w-14 sm:w-16 flex items-center justify-center transition-all focus:outline-none hover:scale-110 active:scale-95 flex-shrink-0 text-pink-500 hover:text-pink-600"
                                        aria-label="Remind me later"
                                        title="Remind me later"
                                    >
                                        <Clock size={42} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Shop Container */}
                {product.shops && (
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 w-full sm:w-auto">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 shadow-sm">
                                {product.shops.shop_logo_url ? (
                                    <img src={product.shops.shop_logo_url} alt={product.shops.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Store size={28} className="text-pink-300" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg sm:text-xl text-gray-900 leading-tight">
                                        {product.shops.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100 mt-0.5">
                                        {product.shops.is_vacation ? (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                                                    In Vacation
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className={`w-2 h-2 rounded-full ${isShopOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isShopOnline ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {isShopOnline ? 'Active' : 'Away'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                    {product.review_count !== undefined && product.review_count > 0
                                        ? `${Number(product.average_rating || 0).toFixed(1)} Product Rating`
                                        : "New Shop"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button className="flex-1 sm:flex-none px-6 py-2.5 border-2 border-pink-600 text-pink-600 font-bold rounded-xl hover:bg-pink-50 transition-colors focus:outline-none flex items-center justify-center gap-2">
                                <MessageCircle size={18} />
                                Message
                            </button>
                            <button
                                onClick={() => navigate(`/shop/${product.shop_id}`)}
                                className="flex-1 sm:flex-none px-6 py-2.5 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-colors shadow-sm focus:outline-none flex items-center justify-center gap-2"
                            >
                                <Store size={18} />
                                Visit Shop
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== RECOMMENDED PRODUCTS ===== */}
                {recommendedProducts && recommendedProducts.length > 0 && (
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">More from this shop</h2>
                            <button
                                onClick={() => navigate(`/shop/${product.shop_id}`)}
                                className="text-pink-600 font-semibold hover:text-pink-700 hover:underline text-sm cursor-pointer focus:outline-none"
                            >
                                See all
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {recommendedProducts.map((rec) => (
                                <RecommendedProductCard key={rec.id} product={rec} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
            {product && (
                <>
                    <ReminderSelectionModal 
                        isOpen={showSelectionModal}
                        onClose={() => setShowSelectionModal(false)}
                        onSelectCreateNew={() => {
                            setShowSelectionModal(false);
                            setShowReminderModal(true);
                        }}
                        onSuccess={(msg) => {
                            setShowSelectionModal(false);
                            setMessage({ text: msg, type: 'success' });
                            setTimeout(() => setMessage(null), 3000);
                        }}
                        productId={product.id}
                    />
                    <AddReminderModal
                        isOpen={showReminderModal}
                        onClose={() => setShowReminderModal(false)}
                        onSuccess={() => {
                            setShowReminderModal(false);
                            setMessage({ text: 'Reminder set successfully!', type: 'success' });
                            setTimeout(() => setMessage(null), 3000);
                        }}
                        productId={product.id}
                    />
                </>
            )}
        </div>
    );
};

/* ===== RECOMMENDED PRODUCT CARD ===== */
const RecommendedProductCard = ({ product }: { product: Product }) => {
    const hasVariants = product.product_variants && product.product_variants.length > 0;
    const maxStock = hasVariants
        ? product.product_variants!.reduce((acc, v) => acc + v.stock, 0)
        : product.stock;
    const isOutOfStock = maxStock <= 0;
    const navigate = useNavigate();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all cursor-pointer flex flex-col h-full ${isOutOfStock ? 'opacity-70 grayscale-[0.3]' : ''}`}
            onClick={() => {
                navigate(`/product/${product.id}`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
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

export default ProductPage;
