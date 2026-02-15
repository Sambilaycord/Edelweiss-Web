import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { User, Package, Heart, MapPin, LogOut, Settings, Camera } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile'); // To switch content

  // 1. Check if user is logged in
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login'); // Kick them out if no session
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };
    getSession();
  }, [navigate]);

  // 2. Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 py-8 px-4"
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Account</h1>

        <div className="flex flex-col md:flex-row gap-6">
          
          {/* --- LEFT SIDEBAR --- */}
          <aside className="w-full md:w-1/4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* User Mini-Profile */}
              <div className="p-6 border-b border-gray-100 flex flex-col items-center">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 mb-3 relative">
                  <User size={40} />
                  <button className="absolute bottom-0 right-0 bg-pink-600 p-1.5 rounded-full text-white hover:bg-pink-700">
                    <Camera size={12} />
                  </button>
                </div>
                <h2 className="font-semibold text-gray-800">{user?.user_metadata?.username || 'Edelweiss User'}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              {/* Navigation Menu */}
              <nav className="p-2">
                <SidebarItem 
                  icon={<User size={18}/>} 
                  label="Personal Info" 
                  isActive={activeTab === 'profile'} 
                  onClick={() => setActiveTab('profile')} 
                />
                <SidebarItem 
                  icon={<Package size={18}/>} 
                  label="My Orders" 
                  isActive={activeTab === 'orders'} 
                  onClick={() => setActiveTab('orders')} 
                />
                <SidebarItem 
                  icon={<Heart size={18}/>} 
                  label="Wishlist" 
                  isActive={activeTab === 'wishlist'} 
                  onClick={() => setActiveTab('wishlist')} 
                />
                <SidebarItem 
                  icon={<MapPin size={18}/>} 
                  label="Addresses" 
                  isActive={activeTab === 'address'} 
                  onClick={() => setActiveTab('address')} 
                />
                <SidebarItem 
                  icon={<Settings size={18}/>} 
                  label="Settings" 
                  isActive={activeTab === 'settings'} 
                  onClick={() => setActiveTab('settings')} 
                />
                
                <div className="my-2 border-t border-gray-100"></div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </nav>
            </div>
          </aside>

          {/* --- RIGHT CONTENT AREA --- */}
          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-6 min-h-[500px]">
              
              {/* CONDITIONAL RENDERING BASED ON TAB */}
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold mb-6 text-gray-800">Personal Information</h2>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none" placeholder="Your Name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" disabled value={user?.email} className="w-full border border-gray-300 bg-gray-50 rounded-lg px-4 py-2 text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input type="tel" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 outline-none" placeholder="+1 234 567 890" />
                    </div>
                    <div className="md:col-span-2 mt-4">
                      <button className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <div className="text-center py-20 text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No orders yet.</p>
                </div>
              )}

               {/* Add other tabs (Wishlist, Address) logic here later */}

            </div>
          </main>
        </div>
      </div>
    </motion.div>
  );
};

// Helper Component for Sidebar Items
const SidebarItem = ({ icon, label, isActive, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium mb-1
      ${isActive ? 'bg-pink-50 text-pink-600' : 'text-gray-600 hover:bg-gray-50'}
    `}
  >
    {icon}
    {label}
  </button>
);

export default ProfilePage;