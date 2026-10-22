import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { ShoppingCart, User, Bell, Search } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

import logo from '../../assets/logo.png';
import text_logo from '../../assets/edelweiss.png';

let navbarChannelSeq = 0;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [count, setCount] = useState(0);

  // Search box mirrors the `q` param while on /search (adjusting state during render, not in an effect)
  const urlQuery = location.pathname === '/search'
    ? new URLSearchParams(location.search).get('q') ?? ''
    : '';
  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchTerm(urlQuery);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    navigate(term ? `/search?${new URLSearchParams({ q: term })}` : '/search');
  };
  const [session, setSession] = useState<Session | null>(null);
  // Incremented per fetch so a slow, outdated response can't overwrite a newer count
  const fetchIdRef = useRef(0);

  const fetchCartCount = useCallback(async (userId: string) => {
    const fetchId = ++fetchIdRef.current;
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', userId)
      .maybeSingle();

    if (cartError) {
      console.error('Failed to load cart:', cartError);
      return;
    }

    if (cart) {
      const { count: itemsCount, error: countError } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('cart_id', cart.id);

      if (countError) {
        console.error('Failed to load cart count:', countError);
        return;
      }
      if (fetchId === fetchIdRef.current) setCount(itemsCount || 0);
    } else if (fetchId === fetchIdRef.current) {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    let active = true;

    // Initial Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      if (session) fetchCartCount(session.user.id);
    });

    // Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSession(session);
      if (session) {
        fetchCartCount(session.user.id);
      } else {
        fetchIdRef.current++; // discard any in-flight fetch for the previous user
        setCount(0);
      }
    });

    // Realtime Listener for Cart Items
    // Unique topic per mount: supabase.channel() reuses a same-named channel, and the previous page's
    // Navbar may still be tearing it down (removeChannel is async), which would leave this one dead.
    const channel = supabase.channel(`navbar_cart_changes_${++navbarChannelSeq}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_items'
      }, async () => {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (active && s?.user?.id) {
          fetchCartCount(s.user.id);
        }
      })
      .subscribe();

    return () => {
      active = false;
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
    // Subscribe once per mount; re-running on session changes tore down and re-created the channel
  }, [fetchCartCount]);

  const handleProtectedNavigation = (path: string) => {
    if (!session) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const currentCount = count;

  return (
    <>
      {/* Top Bar */}
      <div className="text-sm text-gray-700 bg-white border-b border-gray-50">
        <div className="max-w-full mx-auto flex justify-end gap-4 py-2 px-10">
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="hover:text-pink-600 transition-colors cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="hover:text-pink-600 transition-colors cursor-pointer"
          >
            Contact
          </button>
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
            <form className="relative w-full" role="search" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                maxLength={100}
                aria-label="Search products"
                placeholder="Search for items..."
                className="w-full pl-4 pr-10 py-2 border border-[#F4898E] rounded-md text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
              <button type="submit" aria-label="Search" className="absolute right-0 top-0 h-full px-3 text-[#F4898E] hover:text-pink-400 transition-colors cursor-pointer">
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