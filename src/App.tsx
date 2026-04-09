import React, { useEffect, useState } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';

import LoginPage from "./components/login/LoginPage";
import HomePage from "./components/home/HomePage";
import PasswordReset from "./components/login/PasswordReset";
import ProfilePage from "./components/profile/ProfilePage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import SellerRegistration from './components/profile/SellerRegistration';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600" />
    </div>
  );

  const pendingReset = sessionStorage.getItem('pendingPasswordReset') === 'true';

  const router = createBrowserRouter([
    // If user has session but hasn't finished resetting, lock entire app to /password-reset
    ...(session && pendingReset
      ? [
          { path: '/password-reset', element: <PasswordReset /> },
          { path: '*', element: <Navigate to="/password-reset" replace /> },
        ]
      : [
          { path: '/', element: <HomePage /> },
          {
            path: '/login',
            element: session ? <Navigate to="/" replace /> : <LoginPage />,
          },
          { path: '/password-reset', element: <PasswordReset /> },
          {
            path: '/profile',
            element: <ProtectedRoute><ProfilePage /></ProtectedRoute>,
          },
          {
            path: '/become-a-seller',
            element: <ProtectedRoute><SellerRegistration /></ProtectedRoute>,
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ]
    ),
  ]);

  return <RouterProvider router={router} />;
}

export default App;