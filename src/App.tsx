import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabaseClient';

import LoginPage from "./components/login/LoginPage";
import HomePage from "./components/home/HomePage";
import PasswordReset from "./components/login/PasswordReset";
import ProfilePage from "./components/profile/ProfilePage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import SellerRegistration from './components/profile/SellerRegistration';
import CartPage from './components/cart/CartPage';
import CheckoutPage from './components/checkout/CheckoutPage';
import SellerDashboard from './components/dashboard/dashboard';
import ShopPage from './components/shop/ShopPage';
import ProductPage from './components/product/ProductPage';
import NotificationPage from './components/notification/NotificationPage';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let presenceChannel: any = null;

    const setupPresence = async (userId: string) => {
      if (presenceChannel) return;
      presenceChannel = supabase.channel('global_presence');
      presenceChannel
        .on('presence', { event: 'sync' }, () => { })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ user_id: userId, online_at: new Date().toISOString() });
          }
        });
    };

    const teardownPresence = async () => {
      if (presenceChannel) {
        await supabase.removeChannel(presenceChannel);
        presenceChannel = null;
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        setupPresence(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setupPresence(session.user.id);
      } else {
        teardownPresence();
      }
    });

    return () => {
      subscription.unsubscribe();
      teardownPresence();
    };
  }, []);

  if (loading) return null;

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop/:shopId" element={<ShopPage />} />
          <Route path="/product/:productId" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={session ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/password-reset"
            element={session ? <Navigate to="/" replace /> : <PasswordReset />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/become-a-seller"
            element={
              <ProtectedRoute>
                <SellerRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;