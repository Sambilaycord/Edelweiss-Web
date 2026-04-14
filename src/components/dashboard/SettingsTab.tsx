import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
    Camera,
    Store,
    Phone,
    MapPin,
    FileText,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ImagePlus,
    X,
    Upload,
    Trash2,
    ShieldAlert,
    Plane,
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface ShopData {
    id: string;
    name: string;
    description: string;
    business_phone: string;
    shop_logo_url: string | null;
    shop_banner_url: string | null;
    shop_address: string | null;
    is_vacation?: boolean;
}

interface SettingsTabProps {
    shop: ShopData;
    onShopUpdated: (updated: ShopData) => void;
}

const BUCKET = 'public-media';

const SettingsTab: React.FC<SettingsTabProps> = ({ shop, onShopUpdated }) => {
    const navigate = useNavigate();

    // Form state
    const [name, setName] = useState(shop.name || '');
    const [description, setDescription] = useState(shop.description || '');
    const [businessPhone, setBusinessPhone] = useState<string | undefined>(shop.business_phone || '');
    const [shopAddress, setShopAddress] = useState(shop.shop_address || '');
    const [isVacation, setIsVacation] = useState(shop.is_vacation || false);

    // Image preview state
    const [logoPreview, setLogoPreview] = useState<string | null>(shop.shop_logo_url || null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(shop.shop_banner_url || null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    // UI state
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Refs
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Show toast with auto-dismiss
    const showToast = useCallback((type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // Handle file selection
    const handleFileSelect = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'logo' | 'banner'
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('error', 'Please select an image file (JPG, PNG, WebP).');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'Image must be under 5MB.');
            return;
        }

        const previewUrl = URL.createObjectURL(file);

        if (type === 'logo') {
            setLogoFile(file);
            setLogoPreview(previewUrl);
        } else {
            setBannerFile(file);
            setBannerPreview(previewUrl);
        }
    };

    // Remove selected image
    const removeImage = (type: 'logo' | 'banner') => {
        if (type === 'logo') {
            setLogoFile(null);
            setLogoPreview(shop.shop_logo_url || null);
            if (logoInputRef.current) logoInputRef.current.value = '';
        } else {
            setBannerFile(null);
            setBannerPreview(shop.shop_banner_url || null);
            if (bannerInputRef.current) bannerInputRef.current.value = '';
        }
    };

    // Upload image to Supabase Storage
    const uploadImage = async (file: File, path: string): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${path}.${fileExt}`;

        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(filePath, file, { upsert: true });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(filePath);

        // Append timestamp to bust cache
        return `${urlData.publicUrl}?t=${Date.now()}`;
    };

    // Save all changes
    const handleSave = async () => {
        if (!name.trim()) {
            showToast('error', 'Shop name is required.');
            return;
        }

        setSaving(true);

        try {
            // Get the authenticated user's ID for storage path (RLS requires it)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Authentication required');

            let logoUrl = shop.shop_logo_url;
            let bannerUrl = shop.shop_banner_url;

            // Upload logo if changed — path: shops/{user_id}/logo.ext
            if (logoFile) {
                logoUrl = await uploadImage(logoFile, `shops/${user.id}/logo`);
            }

            // Upload banner if changed — path: shops/{user_id}/banner.ext
            if (bannerFile) {
                bannerUrl = await uploadImage(bannerFile, `shops/${user.id}/banner`);
            }

            // Update shop record
            const { data, error } = await supabase
                .from('shops')
                .update({
                    name: name.trim(),
                    description: description.trim(),
                    business_phone: businessPhone || '',
                    shop_address: shopAddress.trim(),
                    shop_logo_url: logoUrl,
                    shop_banner_url: bannerUrl,
                    is_vacation: isVacation,
                })
                .eq('id', shop.id)
                .select()
                .single();

            if (error) throw error;

            // Clear file selections
            setLogoFile(null);
            setBannerFile(null);

            // Notify parent
            if (data) onShopUpdated(data);

            showToast('success', 'Shop settings saved successfully!');
        } catch (err: any) {
            console.error(err);
            showToast('error', err.message || 'Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    // Delete shop handler
    const handleDeleteShop = async () => {
        setDeleting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Authentication required');

            // 1. Delete the shop record
            const { error: shopError } = await supabase
                .from('shops')
                .delete()
                .eq('id', shop.id);

            if (shopError) throw shopError;

            // 2. Revert profile role back to customer
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'customer' })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 3. Navigate to profile page
            navigate('/profile', {
                state: { message: 'Your shop has been deleted.' }
            });
        } catch (err: any) {
            console.error(err);
            showToast('error', err.message || 'Failed to delete shop.');
            setDeleting(false);
        }
    };

    // Check if form has changes
    const hasChanges =
        name !== (shop.name || '') ||
        description !== (shop.description || '') ||
        businessPhone !== (shop.business_phone || '') ||
        shopAddress !== (shop.shop_address || '') ||
        isVacation !== (shop.is_vacation || false) ||
        logoFile !== null ||
        bannerFile !== null;

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Shop Settings</h1>
                <p className="text-gray-500 mt-1">Customize your shop's appearance and information.</p>
            </div>

            {/* ===== TWO-COLUMN LAYOUT ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                {/* ===== LEFT COLUMN — SHOP INFO (3/5) ===== */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Shop Information Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-pink-50/60 to-transparent">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <FileText size={18} className="text-pink-500" />
                                Shop Information
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">Basic details about your shop.</p>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Shop Name */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Store size={15} className="text-gray-400" />
                                    Shop Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Edelweiss Flowers & Gifts"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>

                            {/* Business Phone */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Phone size={15} className="text-gray-400" />
                                    Business Phone
                                </label>
                                <PhoneInput
                                    international
                                    defaultCountry="PH"
                                    value={businessPhone}
                                    onChange={setBusinessPhone}
                                    className="flex w-full border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-pink-500 outline-none transition-shadow text-sm"
                                />
                            </div>

                            {/* Shop Address */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <MapPin size={15} className="text-gray-400" />
                                    Shop Address
                                </label>
                                <input
                                    type="text"
                                    value={shopAddress}
                                    onChange={(e) => setShopAddress(e.target.value)}
                                    placeholder="e.g., 123 Main St, Cebu City, Philippines"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-sm"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <FileText size={15} className="text-gray-400" />
                                    Description
                                </label>
                                <textarea
                                    rows={5}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell customers about your shop, what you sell, and what makes you unique..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">
                                    {description.length} / 500
                                </p>
                            </div>

                            {/* Vacation Mode */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                        <Plane size={15} className="text-gray-400" />
                                        Vacation Mode
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">If enabled, your shop will show as "In Vacation".</p>
                                </div>
                                <button
                                    onClick={() => setIsVacation(!isVacation)}
                                    title="Toggle Vacation Mode"
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                                        isVacation ? 'bg-pink-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            isVacation ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Save Bar */}
                    <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
                        <div>
                            {hasChanges && (
                                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    You have unsaved changes
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className="flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-pink-700 transition-all shadow-lg shadow-pink-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-red-100 bg-gradient-to-r from-red-50/60 to-transparent">
                            <h3 className="font-semibold text-red-700 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-red-500" />
                                Danger Zone
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Delete this shop</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Once deleted, all shop data will be permanently removed. This action cannot be undone.</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-all cursor-pointer text-sm flex-shrink-0 ml-4"
                                >
                                    <Trash2 size={16} />
                                    Delete Shop
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== RIGHT COLUMN — MEDIA UPLOADS (2/5) ===== */}
                <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-6">
                    {/* Shop Logo Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-pink-50/60 to-transparent">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <Store size={18} className="text-pink-500" />
                                Shop Logo
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">Square image, max 5MB.</p>
                        </div>
                        <div className="p-6 flex flex-col items-center">
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => logoInputRef.current?.click()}
                            >
                                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-pink-300 transition-all bg-gray-50 shadow-sm group-hover:shadow-md">
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Shop logo"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                            <Camera size={30} />
                                            <span className="text-[10px] mt-1.5 font-medium">Add Logo</span>
                                        </div>
                                    )}
                                </div>
                                {logoPreview && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                        <Camera size={24} className="text-white" />
                                    </div>
                                )}
                                {logoFile && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeImage('logo'); }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-600 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-4 text-center">Appears next to your shop name.</p>
                            <button
                                onClick={() => logoInputRef.current?.click()}
                                className="mt-3 text-xs font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer hover:underline"
                            >
                                <Upload size={14} /> Choose Image
                            </button>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e, 'logo')}
                            />
                        </div>
                    </div>

                    {/* Shop Banner Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-pink-50/60 to-transparent">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <ImagePlus size={18} className="text-pink-500" />
                                Shop Banner
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">1200 × 300px recommended. Max 5MB.</p>
                        </div>
                        <div className="p-6">
                            <div
                                className="relative group rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-pink-300 transition-all cursor-pointer bg-gray-50 hover:shadow-md"
                                style={{ aspectRatio: '16 / 7', minHeight: '120px' }}
                                onClick={() => bannerInputRef.current?.click()}
                            >
                                {bannerPreview ? (
                                    <>
                                        <img
                                            src={bannerPreview}
                                            alt="Shop banner"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                                                <Camera size={14} /> Change Banner
                                            </span>
                                        </div>
                                        {bannerFile && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeImage('banner'); }}
                                                className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-6">
                                        <Upload size={28} className="mb-2 text-gray-300" />
                                        <p className="text-xs font-medium">Click to upload a banner</p>
                                        <p className="text-[10px] text-gray-300 mt-1">JPG, PNG, or WebP</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={bannerInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e, 'banner')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteConfirmText(''); } }}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-0 overflow-hidden animate-[slideUp_0.3s_ease-out]">
                        {/* Red header bar */}
                        <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Trash2 size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Delete Shop</h3>
                                    <p className="text-red-100 text-xs">This action is permanent and irreversible.</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
                                <p className="text-sm text-red-800 leading-relaxed">
                                    This will <span className="font-bold">permanently delete</span> your shop
                                    <span className="font-bold text-red-900"> "{shop.name}"</span>, including
                                    all products, orders, and associated data.
                                </p>
                            </div>

                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Type <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-red-600">Delete Shop</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Delete Shop"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                                disabled={deleting}
                                autoFocus
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 flex items-center gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                                disabled={deleting}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteShop}
                                disabled={deleteConfirmText !== 'Delete Shop' || deleting}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm"
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        Delete Permanently
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TOAST NOTIFICATION ===== */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium transition-all animate-[slideUp_0.3s_ease-out] ${
                        toast.type === 'success'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                    }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 hover:opacity-80 cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsTab;
