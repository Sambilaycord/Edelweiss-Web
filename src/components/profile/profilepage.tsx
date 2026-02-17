import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import Navbar from '../common/Navbar';
import { useLocation } from 'react-router-dom'
import confetti from 'canvas-confetti';

import PersonalInfoTab from './PersonalInfoTab';
import SellerOnboardingTab from './SellerOnboardingTab';
import AddressTab from './AddressTab';
import { validateField, sanitizeInput } from '../../utils/characterValidation';

import { User, Package, Heart, MapPin, LogOut, Settings, Camera, Loader2, Store } from 'lucide-react';

interface ProfileData {
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  email: string | null;
  avatar_url: string | null;
  gender: string | null;
  birthdate: string | null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [role, setRole] = useState<'customer' | 'shop_owner' | 'admin'>('customer');
  const location = useLocation();

  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    avatar_url: null,
    gender: '',
    birthdate: ''
  });

  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate('/login'); return; }
        setSessionUser(session.user);

        const { data, error } = await supabase
          .from('profiles')
          .select('username, first_name, last_name, phone_number, avatar_url, gender, birthdate, role')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setRole(data.role as any);
          setProfile({
            username: data?.username || session.user.user_metadata?.username || '',
            first_name: data?.first_name || '',
            last_name: data?.last_name || '',
            phone_number: data?.phone_number || '',
            email: session.user.email || '',
            avatar_url: data?.avatar_url || null,
            gender: data?.gender || '',
            birthdate: data?.birthdate || '',
          });
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    getProfile();
  }, [navigate]);

  useEffect(() => {
    // Check if we arrived here from a successful registration
    if (location.state?.confetti) {
      // Fire the confetti!
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // Since Edelweiss is pink-themed, let's use pink and gold!
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors: ['#db2777', '#fbcfe8', '#fbbf24'] });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors: ['#db2777', '#fbcfe8', '#fbbf24'] });
      }, 250);
      
      // Clean up the state so it doesn't fire again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    const cleanFirst = sanitizeInput(profile.first_name || '');
    const cleanLast = sanitizeInput(profile.last_name || '');
    const cleanUsername = sanitizeInput(profile.username || '');

    const userError = validateField('username', cleanUsername);
    const firstError = validateField('firstName', cleanFirst);
    const lastError = validateField('lastName', cleanLast);

    if (userError || firstError || lastError) {
      setMessage({ 
        text: userError || firstError || lastError || 'Invalid input', 
        type: 'error' 
      });
      setUpdating(false);
      return; // Exit function
    }

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: sessionUser.id,
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        phone_number: profile.phone_number || null,
        username: profile.username || null,
        avatar_url: profile.avatar_url || null,
        gender: profile.gender || null,
        birthdate: profile.birthdate || null,
      });
      if (error) throw error;
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating profile', type: 'error' });
    } finally { setUpdating(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-pink-600" size={40} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Account</h1>
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-1/4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-24">
              <div className="p-6 border-b border-gray-100 flex flex-col items-center">
                <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 mb-3 relative overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : ( <User size={48} /> )}
                  <button className="absolute bottom-0 right-0 bg-pink-600 p-2 rounded-full text-white border-2 border-white cursor-pointer">
                    <Camera size={14} />
                  </button>
                </div>
                <h2 className="font-semibold text-gray-800 text-center">
                  {profile.username || 'User'}
                </h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
              <nav className="p-2">
                <SidebarItem icon={<User size={18}/>} label="Personal Info" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                <SidebarItem icon={<Package size={18}/>} label="My Orders" isActive={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                <SidebarItem icon={<Heart size={18}/>} label="Wishlist" isActive={activeTab === 'wishlist'} onClick={() => setActiveTab('wishlist')} />
                <SidebarItem icon={<MapPin size={18}/>} label="Addresses" isActive={activeTab === 'address'} onClick={() => setActiveTab('address')} />
                <SidebarItem icon={<Settings size={18}/>} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                <SidebarItem icon={<Store size={18}/>} label={role === 'shop_owner' ? "My Shop" : "Sell on Edelweiss"} isActive={activeTab === 'shop'} onClick={() => setActiveTab('shop')}/>
                <div className="my-2 border-t border-gray-100"></div>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium cursor-pointer">
                  <LogOut size={18} /> Sign Out
                </button>
              </nav>
            </div>
          </aside>

          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-8 min-h-[500px]">
              {activeTab === 'profile' && (
                <PersonalInfoTab 
                  profile={profile}
                  setProfile={setProfile}
                  onSave={updateProfile}
                  updating={updating}
                  message={message}
                />
              )}
              {activeTab === 'shop' && (
                <SellerOnboardingTab 
                  role={role} 
                  profile={profile} 
                  onSuccess={() => {
                    setRole('shop_owner');
                    setActiveTab('shop');
                  }}
                />
              )}
              {activeTab === 'orders' && (
                <div className="text-center py-20 text-gray-500">
                  <Package size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No orders yet.</p>
                </div>
              )}
              {activeTab === 'address' && (
                <AddressTab />
              )}
            </div>
          </main>
        </div>
      </div>
    </motion.div>
  );
};

const SidebarItem = ({ icon, label, isActive, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-1 cursor-pointer ${isActive ? 'bg-pink-50 text-pink-600' : 'text-gray-600 hover:bg-gray-50'}`}>
    {icon} {label}
  </button>
);

export default ProfilePage;