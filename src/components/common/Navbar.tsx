import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Bell, Search } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

import logo from '../../assets/logo.png';
import text_logo from '../../assets/edelweiss.png';

interface NavbarProps {
  cartCount?: number; // Optional: If not provided, defaults to 0
}

const Navbar: React.FC<NavbarProps> = ({ cartCount = 0 }) => {
  const navigate = useNavigate();

  const handleUserClick = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <>
      {/* Top Bar */}
      <div className="text-sm text-gray-700 bg-white">
        <div className="max-w-full mx-auto flex justify-end gap-4 py-2 px-10">
          <Link to="/about" className="hover:text-pink-600">About</Link>
          <Link to="/contact" className="hover:text-pink-600">Contact</Link>
          <div className="flex items-center gap-2"> 
             <Link to="/login" className="hover:text-pink-600">Log in</Link>
             <span className="text-gray-400">|</span>
             <Link to="/signup" className="hover:text-pink-600">Sign up</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur z-40 shadow-sm">
        <div className="max-w-full mx-auto flex items-center justify-between py-4 px-10">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-4">
            <img src={logo} alt="logo" className="w-12 h-12 object-contain" />
            <img src={text_logo} alt="Edelweiss" className="h-6 object-contain" />
          </Link>

          {/* Center: Search Bar */}
          <div className="hidden md:flex w-[40%] mx-auto">
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-4 pr-10 py-2 border border-[#F4898E] rounded-md text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
              />
              <button className="absolute right-0 top-0 h-full px-3 text-[#F4898E] hover:text-pink-200 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center gap-3">
              <button aria-label="Open cart" className="p-2 text-[#F4898E] hover:bg-pink-50 rounded-full flex items-center justify-center cursor-pointer">
                <ShoppingCart className="w-6 h-6" />
              </button>
              
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}

              <button aria-label="Notifications" className="p-2 text-[#F4898E] rounded-full cursor-pointer hover:bg-pink-50">
                <Bell className="w-6 h-6" />
              </button>
              <button aria-label="Account" onClick={handleUserClick} className="p-2 text-[#F4898E] rounded-full cursor-pointer hover:bg-pink-50">
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