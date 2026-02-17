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
import CartPage from './components/cart/CartPage'; // Imported CartPage

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null; 

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;