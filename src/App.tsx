import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { isRecoverySession } from './lib/passwordRecovery';
import { startPresence, stopPresence } from './lib/presence';

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Footer from './components/common/Footer';
import ScrollToTop from './components/common/ScrollToTop';

// Pages are loaded on demand so the first visit only downloads what it needs
const LoginPage = lazy(() => import('./components/login/LoginPage'));
const HomePage = lazy(() => import('./components/home/HomePage'));
const PasswordReset = lazy(() => import('./components/login/PasswordReset'));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage'));
const SellerRegistration = lazy(() => import('./components/profile/SellerRegistration'));
const CartPage = lazy(() => import('./components/cart/CartPage'));
const CheckoutPage = lazy(() => import('./components/checkout/CheckoutPage'));
const SellerDashboard = lazy(() => import('./components/dashboard/dashboard'));
const ShopPage = lazy(() => import('./components/shop/ShopPage'));
const ProductPage = lazy(() => import('./components/product/ProductPage'));
const NotificationPage = lazy(() => import('./components/notification/NotificationPage'));
const SearchPage = lazy(() => import('./components/search/SearchPage'));

interface RedirectState {
  from?: { pathname: string; search?: string; hash?: string };
}

// Redirects already-authenticated users away from guest-only pages (login),
// sending them back to the page ProtectedRoute bounced them from, if any.
function GuestOnly({ session, children }: { session: Session | null; children: ReactNode }) {
  const location = useLocation();
  if (!session) return <>{children}</>;
  const from = (location.state as RedirectState | null)?.from;
  const to = from ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}` : '/';
  return <Navigate to={to} replace />;
}

function AppLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      if (error) console.error('Failed to load session:', error);
      let current = initialSession;

      // A leftover password-recovery session (abandoned reset, or a recovery link) must not
      // act as a login — the user has to finish setting a new password first.
      if (isRecoverySession(current)) {
        await supabase.auth.signOut({ scope: 'local' });
        current = null;
      }

      if (cancelled) return;
      setSession(current);
      setLoading(false);
      startPresence(current?.user?.id ?? null);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (cancelled) return;
      // PasswordReset briefly holds a recovery session while it changes the password; never treat it as logged in.
      const newSession = isRecoverySession(authSession) ? null : authSession;
      setSession(newSession);
      startPresence(newSession?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      stopPresence();
    };
  }, []);

  if (loading) return null;

  return (
    <>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Suspense fallback={null}>
            <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
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
            element={
              <GuestOnly session={session}>
                <LoginPage />
              </GuestOnly>
            }
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
            </Suspense>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </>
  );
}

// A data router is required for useBlocker (used by PasswordReset).
const router = createBrowserRouter(
  [{ path: '*', element: <AppLayout /> }],
  { basename: import.meta.env.BASE_URL }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
