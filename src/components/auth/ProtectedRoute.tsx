import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!cancelled) setAuthenticated(!!session);
      } catch (error) {
        console.error("Auth check failed:", error);
        if (!cancelled) setAuthenticated(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkAuth();

    // Keep in sync so signing out (or session expiry) on a protected page redirects to login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    // A simple loading state while checking the session
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    // Redirect to login, but save the current location so we can go back later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};