import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Plus,
    Package,
    Search,
    Edit,
    Trash2,
    X,
    Upload,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Image as ImageIcon,
    ToggleLeft,
    ToggleRight,
    ChevronLeft,
    ChevronRight,
    GripVertical,
} from 'lucide-react';

/* ===== TYPES ===== */
interface ProductVariant {
    id: string;
    product_id: string;
    name: string;
    price: number;
    stock: number;
    sku?: string;
    is_active: boolean;
    created_at?: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    image_urls: string[];
    is_active: boolean;
    shop_id: string;
    created_at?: string;
    product_variants?: ProductVariant[];
}

interface ProductsTabProps {
    shopId: string;
}

const BUCKET = 'public-media';

/* ===== MAIN COMPONENT ===== */
const ProductsTab: React.FC<ProductsTabProps> = ({ shopId }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*, product_variants(*)')
            .eq('shop_id', shopId)
            .order('created_at', { ascending: false });

        if (!error && data) setProducts(data);
        setLoading(false);
    }, [shopId]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // Toggle active status
    const toggleActive = async (product: Product) => {
        const { error } = await supabase
            .from('products')
            .update({ is_active: !product.is_active })
            .eq('id', product.id);

        if (!error) {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
            showToast('success', `Product ${!product.is_active ? 'activated' : 'deactivated'}.`);
        }
    };

    // Delete product
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', deleteTarget.id);

        if (!error) {
            setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
            showToast('success', 'Product deleted.');
        } else {
            showToast('error', 'Failed to delete product.');
        }

        setDeleting(false);
        setDeleteTarget(null);
    };

    // Filter products
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                    <p className="text-gray-500 mt-1">Manage your product listings.</p>
                </div>
                <button
                    onClick={() => { setEditingProduct(null); setShowModal(true); }}
                    className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 cursor-pointer text-sm"
                >
                    <Plus size={18} /> Add Product
                </button>
            </div>

            {/* Search Bar */}
            {products.length > 0 && (
                <div className="relative mb-6">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-sm bg-white"
                    />
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-pink-600" size={32} />
                </div>
            ) : products.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-400 mb-5">
                        <Package size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No products yet</h3>
                    <p className="text-gray-400 text-sm max-w-sm mb-6">
                        Start building your catalog by adding your first product. Customers will be able to browse and purchase from your shop.
                    </p>
                    <button
                        onClick={() => { setEditingProduct(null); setShowModal(true); }}
                        className="flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-700 transition-all cursor-pointer text-sm"
                    >
                        <Plus size={18} /> Add Your First Product
                    </button>
                </div>
            ) : (
                /* Product Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {filtered.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={() => { setEditingProduct(product); setShowModal(true); }}
                            onDelete={() => setDeleteTarget(product)}
                            onToggleActive={() => toggleActive(product)}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400">
                            <Search size={32} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No products match "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <ProductModal
                    shopId={shopId}
                    product={editingProduct}
                    onClose={() => { setShowModal(false); setEditingProduct(null); }}
                    onSaved={() => {
                        setShowModal(false);
                        setEditingProduct(null);
                        fetchProducts();
                        showToast('success', editingProduct ? 'Product updated!' : 'Product added!');
                    }}
                    showToast={showToast}
                />
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[slideUp_0.3s_ease-out]">
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-red-50 rounded-2xl mx-auto flex items-center justify-center text-red-500 mb-4">
                                <Trash2 size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Product</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete <span className="font-semibold text-gray-700">"{deleteTarget.name}"</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all cursor-pointer text-sm disabled:opacity-50"
                                >
                                    {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium animate-[slideUp_0.3s_ease-out] ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                    <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80 cursor-pointer"><X size={16} /></button>
                </div>
            )}
        </div>
    );
};

/* ===== PRODUCT CARD ===== */
const ProductCard = ({ product, onEdit, onDelete, onToggleActive }: {
    product: Product;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
}) => (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden group hover:shadow-md transition-all ${!product.is_active ? 'border-gray-200 opacity-70' : 'border-gray-100'}`}>
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
            {product.image_urls && product.image_urls.length > 0 ? (
                <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={40} />
                </div>
            )}

            {/* Status badge */}
            <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${product.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                {product.is_active ? 'Active' : 'Inactive'}
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={onEdit} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors cursor-pointer shadow-lg">
                    <Edit size={16} />
                </button>
                <button onClick={onToggleActive} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer shadow-lg">
                    {product.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button onClick={onDelete} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer shadow-lg">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>

        {/* Info */}
        <div className="p-4">
            <h4 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h4>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{product.description || 'No description'}</p>
            <div className="flex items-center justify-between mt-3">
                <span className="text-pink-600 font-bold text-sm">
                    {product.product_variants && product.product_variants.length > 0 && <span className="text-gray-400 font-normal text-xs mr-1">from</span>}
                    ₱{Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-xs font-medium ${product.stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                    {product.product_variants && product.product_variants.length > 0 
                        ? `${product.stock} total` 
                        : (product.stock > 0 ? `${product.stock} in stock` : 'Out of stock')}
                </span>
            </div>
        </div>
    </div>
);

/* ===== ADD / EDIT MODAL ===== */
const ProductModal = ({ shopId, product, onClose, onSaved, showToast }: {
    shopId: string;
    product: Product | null;
    onClose: () => void;
    onSaved: () => void;
    showToast: (type: 'success' | 'error', message: string) => void;
}) => {
    const isEditing = !!product;

    const [name, setName] = useState(product?.name || '');
    const [description, setDescription] = useState(product?.description || '');
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [stock, setStock] = useState(product?.stock?.toString() || '');
    const [isActive, setIsActive] = useState(product?.is_active ?? true);
    const [saving, setSaving] = useState(false);

    // Variants State
    const [hasVariants, setHasVariants] = useState(!!product?.product_variants?.length);
    const [variants, setVariants] = useState<Partial<ProductVariant>[]>(
        product?.product_variants?.length ? [...product.product_variants].sort((a,b) => a.price - b.price) : []
    );

    // Image management
    const [existingImages, setExistingImages] = useState<string[]>(product?.image_urls || []);
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image carousel index for preview
    const allPreviews = [...existingImages, ...newImagePreviews];
    const [previewIndex, setPreviewIndex] = useState(0);

    const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(f => {
            if (!f.type.startsWith('image/')) return false;
            if (f.size > 5 * 1024 * 1024) return false;
            return true;
        });

        if (validFiles.length < files.length) {
            showToast('error', 'Some files were skipped (must be images under 5MB).');
        }

        const totalImages = existingImages.length + newImageFiles.length + validFiles.length;
        if (totalImages > 8) {
            showToast('error', 'Maximum 8 images per product.');
            return;
        }

        const previews = validFiles.map(f => URL.createObjectURL(f));
        setNewImageFiles(prev => [...prev, ...validFiles]);
        setNewImagePreviews(prev => [...prev, ...previews]);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
        if (previewIndex >= allPreviews.length - 1) setPreviewIndex(Math.max(0, previewIndex - 1));
    };

    const removeNewImage = (index: number) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (previewIndex >= allPreviews.length - 1) setPreviewIndex(Math.max(0, previewIndex - 1));
    };

    const handleSave = async () => {
        const isUsingVariants = hasVariants && variants.length > 0;

        if (!name.trim()) { showToast('error', 'Product name is required.'); return; }
        if (!isUsingVariants && (!price || parseFloat(price) < 0)) { showToast('error', 'Enter a valid base price.'); return; }
        if (!isUsingVariants && (!stock || parseInt(stock) < 0)) { showToast('error', 'Enter a valid base stock quantity.'); return; }

        if (isUsingVariants) {
            for (let i = 0; i < variants.length; i++) {
                const v = variants[i];
                if (!v.name?.trim()) { showToast('error', `Variant ${i + 1} needs a name.`); return; }
                if (v.price === undefined || v.price < 0) { showToast('error', `Variant ${i + 1} needs a valid price.`); return; }
                if (v.stock === undefined || v.stock < 0) { showToast('error', `Variant ${i + 1} needs a valid stock.`); return; }
            }
        }

        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Authentication required');

            // Upload new images
            const uploadedUrls: string[] = [];
            for (const file of newImageFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `products/${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET)
                    .upload(fileName, file, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
                uploadedUrls.push(urlData.publicUrl);
            }

            const finalImageUrls = [...existingImages, ...uploadedUrls];

            const computedPrice = isUsingVariants 
                ? Math.min(...variants.map(v => v.price || 0)) 
                : parseFloat(price);
            
            const computedStock = isUsingVariants
                ? variants.reduce((acc, v) => acc + (v.stock || 0), 0)
                : parseInt(stock);

            const productData = {
                name: name.trim(),
                description: description.trim(),
                price: computedPrice,
                stock: computedStock,
                image_urls: finalImageUrls,
                is_active: isActive,
                shop_id: shopId,
            };

            let savedProductId = isEditing && product ? product.id : null;

            if (isEditing && product) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', product.id);
                if (error) throw error;
            } else {
                const { data: newProd, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select()
                    .single();
                if (error) throw error;
                savedProductId = newProd.id;
            }

            // Sync variants
            if (savedProductId) {
                if (isUsingVariants) {
                    // Find deleted variants
                    if (isEditing && product?.product_variants) {
                        const currentVariantIds = variants.map(v => v.id).filter(Boolean);
                        const deletedVariants = product.product_variants.filter(v => !currentVariantIds.includes(v.id));
                        if (deletedVariants.length > 0) {
                            await supabase.from('product_variants').delete().in('id', deletedVariants.map(v => v.id));
                        }
                    }

                    // Upsert variants
                    const variantsToUpsert = variants.map(v => ({
                        id: v.id || undefined,
                        product_id: savedProductId,
                        name: v.name,
                        price: v.price,
                        stock: v.stock,
                        sku: v.sku,
                        is_active: v.is_active ?? true,
                    }));

                    const newVariants = variantsToUpsert.filter(v => !v.id).map(({id, ...rest}) => rest);
                    const updateVariants = variantsToUpsert.filter(v => v.id);

                    if (newVariants.length > 0) {
                        const { error: insertError } = await supabase.from('product_variants').insert(newVariants);
                        if (insertError) throw insertError;
                    }

                    for (const v of updateVariants) {
                        const { id, ...rest } = v;
                        const { error: updateError } = await supabase.from('product_variants').update(rest).eq('id', id);
                        if (updateError) throw updateError;
                    }
                } else {
                    // Variants disabled, wipe them out
                    if (isEditing) {
                        await supabase.from('product_variants').delete().eq('product_id', savedProductId);
                    }
                }
            }

            onSaved();
        } catch (err: any) {
            console.error(err);
            showToast('error', err.message || 'Failed to save product.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !saving && onClose()} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">
                        {isEditing ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button onClick={() => !saving && onClose()} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto flex-1 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Form Fields */}
                        <div className="space-y-4">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Product Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Bouquet of Roses"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-sm"
                                />
                            </div>

                            {/* Active Toggle & Has Variants Toggle */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                                    <div className="mr-2">
                                        <p className="text-sm font-semibold text-gray-700 leading-tight">Active</p>
                                    </div>
                                    <button onClick={() => setIsActive(!isActive)} className="cursor-pointer">
                                        {isActive ? <ToggleRight size={28} className="text-pink-600" /> : <ToggleLeft size={28} className="text-gray-300" />}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                                    <div className="mr-2">
                                        <p className="text-sm font-semibold text-gray-700 leading-tight">Has Variants</p>
                                    </div>
                                    <button onClick={() => {
                                        setHasVariants(!hasVariants);
                                        if (!hasVariants && variants.length === 0) {
                                            setVariants([{ name: '', price: price ? parseFloat(price) : 0, stock: stock ? parseInt(stock) : 0 }]);
                                        }
                                    }} className="cursor-pointer">
                                        {hasVariants ? <ToggleRight size={28} className="text-pink-600" /> : <ToggleLeft size={28} className="text-gray-300" />}
                                    </button>
                                </div>
                            </div>

                            {/* Price & Stock OR Variants List */}
                            {!hasVariants ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Price (₱) <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Stock <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={stock}
                                            onChange={(e) => setStock(e.target.value)}
                                            placeholder="0"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-semibold text-gray-700">Product Variants</label>
                                        <button 
                                            onClick={() => setVariants([...variants, { name: '', price: 0, stock: 0 }])}
                                            className="text-xs text-pink-600 font-bold flex items-center gap-1 hover:text-pink-700"
                                        >
                                            <Plus size={14} /> Add Variant
                                        </button>
                                    </div>
                                    
                                    {variants.map((variant, index) => (
                                        <div key={index} className="flex gap-2 items-start bg-white p-3 rounded-lg shadow-sm border border-gray-100 relative group">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    value={variant.name || ''}
                                                    onChange={(e) => {
                                                        const newVariants = [...variants];
                                                        newVariants[index].name = e.target.value;
                                                        setVariants(newVariants);
                                                    }}
                                                    placeholder="Variant Name (e.g. Small, Red)"
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-pink-500 outline-none text-xs"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={variant.price === undefined ? '' : variant.price}
                                                        onChange={(e) => {
                                                            const newVariants = [...variants];
                                                            newVariants[index].price = e.target.value ? parseFloat(e.target.value) : undefined;
                                                            setVariants(newVariants);
                                                        }}
                                                        placeholder="Price ₱"
                                                        className="w-1/2 px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-pink-500 outline-none text-xs"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={variant.stock === undefined ? '' : variant.stock}
                                                        onChange={(e) => {
                                                            const newVariants = [...variants];
                                                            newVariants[index].stock = e.target.value ? parseInt(e.target.value) : undefined;
                                                            setVariants(newVariants);
                                                        }}
                                                        placeholder="Stock"
                                                        className="w-1/2 px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-pink-500 outline-none text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                                                className="text-gray-300 hover:text-red-500 mt-2 p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {variants.length === 0 && (
                                        <p className="text-xs text-gray-400 italic text-center py-2">No variants added yet.</p>
                                    )}
                                </div>
                            )}



                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                <textarea
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your product..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Right: Image Upload */}
                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-gray-700">
                                Product Images <span className="text-xs text-gray-400 font-normal">(max 8)</span>
                            </label>

                            {/* Main Preview */}
                            <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                {allPreviews.length > 0 ? (
                                    <>
                                        <img
                                            src={allPreviews[previewIndex]}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        {allPreviews.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setPreviewIndex(p => (p - 1 + allPreviews.length) % allPreviews.length)}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setPreviewIndex(p => (p + 1) % allPreviews.length)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2.5 py-1 rounded-full font-medium">
                                                    {previewIndex + 1} / {allPreviews.length}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div
                                        className="w-full h-full flex flex-col items-center justify-center text-gray-300 cursor-pointer hover:text-pink-400 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageIcon size={48} className="mb-2" />
                                        <p className="text-xs font-medium">Click to add images</p>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            <div className="flex gap-2 flex-wrap">
                                {existingImages.map((url, i) => (
                                    <div key={`existing-${i}`} className="relative group">
                                        <button
                                            onClick={() => setPreviewIndex(i)}
                                            className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${previewIndex === i ? 'border-pink-500 shadow-md' : 'border-gray-200 hover:border-pink-300'}`}
                                        >
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                        </button>
                                        <button
                                            onClick={() => removeExistingImage(i)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                                {newImagePreviews.map((url, i) => (
                                    <div key={`new-${i}`} className="relative group">
                                        <button
                                            onClick={() => setPreviewIndex(existingImages.length + i)}
                                            className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${previewIndex === existingImages.length + i ? 'border-pink-500 shadow-md' : 'border-gray-200 hover:border-pink-300'}`}
                                        >
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                        </button>
                                        <button
                                            onClick={() => removeNewImage(i)}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}

                                {/* Add Button */}
                                {allPreviews.length < 8 && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 hover:border-pink-300 flex items-center justify-center text-gray-300 hover:text-pink-400 transition-colors cursor-pointer"
                                    >
                                        <Plus size={20} />
                                    </button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleAddImages}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={() => !saving && onClose()}
                        disabled={saving}
                        className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-pink-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 cursor-pointer text-sm disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                {isEditing ? 'Updating...' : 'Adding...'}
                            </>
                        ) : (
                            <>
                                {isEditing ? 'Update Product' : 'Add Product'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductsTab;
