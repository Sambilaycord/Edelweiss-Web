import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../common/Navbar';
import SettingsTab from './SettingsTab';
import ProductsTab from './ProductsTab';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    BarChart3,
    Settings,
    ArrowLeft,
    Plus,
    TrendingUp,
    Clock,
    DollarSign,
    Loader2,
    Store,
    ChevronRight,
    Eye,
    Edit
} from 'lucide-react';

interface ShopData {
    id: string;
    name: string;
    description: string;
    business_phone: string;
    shop_logo_url: string | null;
    shop_banner_url: string | null;
    shop_address: string | null;
}

type DashboardTab = 'overview' | 'products' | 'orders' | 'analytics' | 'settings';

const SellerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState<ShopData | null>(null);
    const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
    const [dashboardAction, setDashboardAction] = useState<string | null>(null);
    const [productCount, setProductCount] = useState(0);

    // Fetch product count for a given shop
    const fetchProductCount = async (shopId: string) => {
        const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId);
        setProductCount(count || 0);
    };

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { navigate('/login'); return; }

                const { data, error } = await supabase
                    .from('shops')
                    .select('id, name, description, business_phone, shop_logo_url, shop_banner_url, shop_address')
                    .eq('owner_id', session.user.id)
                    .single();

                if (error || !data) {
                    navigate('/profile', { state: { activeTab: 'shop' } });
                    return;
                }
                setShop(data);
                fetchProductCount(data.id);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchShop();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-pink-600" size={40} />
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-pink-50">
            <Navbar />

            <div className="flex min-h-[calc(100vh-80px)]">
                {/* ===== SIDEBAR ===== */}
                <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen pt-4">
                    {/* Shop Identity */}
                    <div className="px-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-200">
                                <Store size={20} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-bold text-gray-800 text-sm truncate">{shop?.name || 'My Shop'}</h2>
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span> Active
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
                        <NavItem icon={<LayoutDashboard size={18} />} label="Overview" isActive={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); if (shop) fetchProductCount(shop.id); }} />
                        <NavItem icon={<Package size={18} />} label="Products" isActive={activeTab === 'products'} onClick={() => setActiveTab('products')} badge={String(productCount)} />
                        <NavItem icon={<ShoppingBag size={18} />} label="Orders" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                        <NavItem icon={<BarChart3 size={18} />} label="Analytics" isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />

                        <div className="my-3 border-t border-gray-100"></div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">General</p>
                        <NavItem icon={<Settings size={18} />} label="Shop Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    </nav>

                    {/* Back to Profile */}
                    <div className="p-3 border-t border-gray-100">
                        <button
                            onClick={() => navigate('/profile', { state: { activeTab: 'shop' } })}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                        >
                            <ArrowLeft size={16} /> Back to Profile
                        </button>
                    </div>
                </aside>

                {/* ===== MAIN CONTENT ===== */}
                <main className="flex-1 p-8">
                    {activeTab === 'overview' && <OverviewTab shopName={shop?.name || 'My Shop'} productCount={productCount} onNavigate={(tab, action) => {
                        if (action) setDashboardAction(action);
                        setActiveTab(tab);
                    }} />}
                    {activeTab === 'products' && shop && <ProductsTab shopId={shop.id} initialAction={dashboardAction} onClearAction={() => setDashboardAction(null)} />}
                    {activeTab === 'orders' && <PlaceholderTab icon={<ShoppingBag size={48} />} title="Orders" description="Incoming customer orders will appear here." />}
                    {activeTab === 'analytics' && <PlaceholderTab icon={<BarChart3 size={48} />} title="Analytics" description="Sales charts and performance metrics coming soon." />}
                    {activeTab === 'settings' && shop && <SettingsTab shop={shop} onShopUpdated={(updated) => setShop(updated)} />}
                </main>
            </div>
        </motion.div>
    );
};

/* ===== OVERVIEW TAB ===== */
const OverviewTab = ({ shopName, productCount, onNavigate }: { shopName: string; productCount: number; onNavigate: (tab: DashboardTab, action?: string) => void }) => (
    <div>
        {/* Welcome Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-pink-600">Welcome back!</h1>
            <p className="text-gray-500 mt-1">Here's what's happening with <span className="text-pink-600 font-semibold">{shopName}</span> today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard title="Total Products" value={String(productCount)} icon={<Package size={22} />} color="pink" subtitle={productCount === 0 ? 'Add your first product' : `${productCount} product${productCount !== 1 ? 's' : ''} listed`} />
            <StatCard title="Total Orders" value="0" icon={<ShoppingBag size={22} />} color="blue" subtitle="No orders yet" />
            <StatCard title="Revenue" value="₱0.00" icon={<DollarSign size={22} />} color="green" subtitle="Start selling to earn" />
            <StatCard title="Pending" value="0" icon={<Clock size={22} />} color="amber" subtitle="No pending items" />
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                    <QuickAction icon={<Plus size={18} />} label="Add New Product" description="List a product in your shop" onClick={() => onNavigate('products', 'add_product')} />
                    <QuickAction icon={<Eye size={18} />} label="View My Shop" description="See how customers see it" />
                    <QuickAction icon={<Edit size={18} />} label="Edit Shop Info" description="Update name, description, etc." onClick={() => onNavigate('settings')} />
                </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">Recent Activity</h3>
                    <button className="text-xs text-pink-600 font-medium hover:underline cursor-pointer">View All</button>
                </div>
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <TrendingUp size={40} className="mb-3 text-gray-300" />
                    <p className="text-sm">No recent activity yet.</p>
                    <p className="text-xs text-gray-300 mt-1">Your latest orders and updates will show up here.</p>
                </div>
            </div>
        </div>
    </div>
);


/* ===== PLACEHOLDER TAB ===== */
const PlaceholderTab = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center mt-4">
            <div className="text-gray-300 mb-4">{icon}</div>
            <p className="text-gray-400 text-sm">{description}</p>
            <p className="text-xs text-gray-300 mt-2">This feature is coming soon.</p>
        </div>
    </div>
);

/* ===== STAT CARD ===== */
const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string; value: string; icon: React.ReactNode; color: string; subtitle: string;
}) => {
    const colors: Record<string, { bg: string; icon: string; shadow: string }> = {
        pink: { bg: 'bg-pink-50', icon: 'text-pink-600', shadow: 'shadow-pink-100' },
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600', shadow: 'shadow-blue-100' },
        green: { bg: 'bg-green-50', icon: 'text-green-600', shadow: 'shadow-green-100' },
        amber: { bg: 'bg-amber-50', icon: 'text-amber-600', shadow: 'shadow-amber-100' },
    };
    const c = colors[color] || colors.pink;
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow ${c.shadow}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center ${c.icon}`}>{icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
    );
};

/* ===== QUICK ACTION ===== */
const QuickAction = ({ icon, label, description, onClick }: { icon: React.ReactNode; label: string; description: string; onClick?: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 transition-colors text-left group cursor-pointer border border-gray-100 hover:border-pink-200">
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors flex-shrink-0">
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-700 group-hover:text-pink-600 transition-colors">{label}</p>
            <p className="text-xs text-gray-400">{description}</p>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-pink-400 transition-colors" />
    </button>
);

/* ===== SIDEBAR NAV ITEM ===== */
const NavItem = ({ icon, label, isActive, onClick, badge }: {
    icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; badge?: string;
}) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive
            ? 'bg-pink-50 text-pink-600 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
    >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-pink-200 text-pink-700' : 'bg-gray-100 text-gray-500'
                }`}>{badge}</span>
        )}
    </button>
);

export default SellerDashboard;
