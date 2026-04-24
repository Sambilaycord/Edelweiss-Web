import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Bell, Search, Store } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

import logo from '../../assets/logo.png';
import text_logo from '../../assets/edelweiss.png';

interface NavbarProps {
  cartCount?: number; 
}

const Navbar: React.FC<NavbarProps> = ({ cartCount: propCount }) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [session, setSession] = useState<any>(null);

  const fetchCartCount = useCallback(async (userId: string) => {
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', userId)
      .maybeSingle();

    if (cart) {
      const { count: itemsCount } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('cart_id', cart.id);
      
      setCount(itemsCount || 0);
    } else {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    // Initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCartCount(session.user.id);
    });

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchCartCount(session.user.id);
      } else {
        setCount(0);
      }
    });

    // Realtime Listener for Cart Items
    const channel = supabase.channel('navbar_cart_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'cart_items' 
      }, async (payload) => {
        console.log("Cart change detected:", payload);
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s?.user?.id) {
          fetchCartCount(s.user.id);
        }
      })
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchCartCount, session?.user?.id]);

  const handleProtectedNavigation = (path: string) => {
    if (!session) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const currentCount = propCount !== undefined ? propCount : count;

  return (
    <>
      {/* Top Bar */}
      <div className="text-sm text-gray-700 bg-white border-b border-gray-50">
        <div className="max-w-full mx-auto flex justify-end gap-4 py-2 px-10">
          <Link to="/about" className="hover:text-pink-600 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-pink-600 transition-colors">Contact</Link>
        </div>
      </div>
      <header className="sticky top-0 bg-white/95 backdrop-blur z-40 shadow-sm">
        <div className="max-w-full mx-auto flex items-center justify-between py-4 px-10">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-4 group">
            <img src={logo} alt="logo" className="w-12 h-12 object-contain group-hover:scale-105 transition-transform" />
            <img src={text_logo} alt="Edelweiss" className="h-6 object-contain" />
          </Link>

          {/* Center: Search Bar */}
          <div className="hidden md:flex w-[40%] mx-auto">
            <form className="relative w-full" onSubmit={(e) => { e.preventDefault(); }}>
              <input 
                type="text" 
                placeholder="Search for items..." 
                className="w-full pl-4 pr-10 py-2 border border-[#F4898E] rounded-md text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
              <button type="submit" className="absolute right-0 top-0 h-full px-3 text-[#F4898E] hover:text-pink-400 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center gap-1">
              {/* Cart Icon */}
              <div className="relative">
                <button 
                  onClick={() => handleProtectedNavigation('/cart')} 
                  className="p-2 text-[#F4898E] hover:bg-pink-50 rounded-full transition-colors cursor-pointer"
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-6 h-6" />
                </button>
                {currentCount > 0 && (
                  <span className="absolute top-0 right-0 bg-pink-400 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-[10px] transform translate-x-1 -translate-y-1 shadow-sm">
                    {currentCount}
                  </span>
                )}
              </div>
              
              {/* Notifications */}
              <button 
                onClick={() => handleProtectedNavigation('/notifications')}
                className="p-2 text-[#F4898E] rounded-full hover:bg-pink-50 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6" />
              </button>

              {/* Profile/Account */}
              <button 
                onClick={() => handleProtectedNavigation('/profile')} 
                className="p-2 text-[#F4898E] rounded-full hover:bg-pink-50 transition-colors cursor-pointer"
                aria-label="Account"
              >
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>

        </div>
      </header>
    </>
  );
};

export default Navbar;