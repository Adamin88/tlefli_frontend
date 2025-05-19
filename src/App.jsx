import React, { useEffect, useRef, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import TlefliPRO from './pages/TlefliPRO'
import Login from './pages/Login'
import Register from './pages/Register'
import ItemsList from './pages/ItemsList'
import ItemDetails from './pages/ItemDetails'
import ReportItem from './pages/ReportItem'
import EditItem from './pages/EditItem'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import AdminPanel from './pages/AdminPanel'
import NotificationsPage from './pages/NotificationsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import CompleteProfile from './pages/CompleteProfile';
import CompleteBusinessProfile from './pages/CompleteBusinessProfile';
import QRScannerPage from './pages/QRScannerPage';
import VerifyItemPage from './pages/VerifyItemPage';
import CheckoutPage from './pages/CheckoutPage';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Create router with future flags
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  },
  basename: '/'
};

// Update the ProtectedRoute component to handle auth state persistence better
const ProtectedRoute = ({ children, requireAdmin }) => {
  const { isAuthenticated, loading, user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAttempted = useRef(false);
  const attemptedRefresh = useRef(false);
  const profileCheckDone = useRef(false);
  const initialLoadComplete = useRef(false);

  // Handle initial page load without redirecting immediately
  useEffect(() => {
    if (!initialLoadComplete.current) {
      initialLoadComplete.current = true;
      
      // Attempt to refresh auth silently without forcing redirect
      if (!isAuthenticated && !attemptedRefresh.current) {
        console.log('Protected route checking authentication status');
        attemptedRefresh.current = true;
        refreshAuth(true); // Pass true to prevent clearing user on failure
      }
    }
  }, [refreshAuth, isAuthenticated]);

  useEffect(() => {
    // Only redirect after auth check is complete, still not authenticated, and initial load is done
    if (!loading && initialLoadComplete.current) {
      if (!isAuthenticated && !redirectAttempted.current) {
        // Add a short delay to prevent redirect during page refresh
        const redirectTimer = setTimeout(() => {
          console.log('Protected route: Not authenticated, redirecting to login');
          redirectAttempted.current = true;
          
          // Store the intended destination to redirect after login
          navigate('/login', { 
            state: { from: location },
            replace: true // Use replace to avoid building up history
          });
        }, 300);
        
        return () => clearTimeout(redirectTimer);
      } else if (isAuthenticated && requireAdmin && (!user || user.role !== 'admin')) {
        // If admin route but user is not admin, redirect to dashboard
        console.log('Admin route: User not admin, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate, location, requireAdmin, user, initialLoadComplete.current]);

  // Check if user needs to complete profile
  useEffect(() => {
    if (isAuthenticated && user && !profileCheckDone.current) {
      profileCheckDone.current = true;
      
      console.log('Checking if profile is complete:', user.profileCompleted);
      
      if (user.profileCompleted === false) { // Explicitly check for false (not undefined)
        console.log('User needs to complete profile, redirecting');
        
        // Redirect based on user type
        if (user.userType === 'business') {
          navigate('/complete-business-profile', { replace: true });
        } else {
          navigate('/complete-profile', { replace: true });
        }
      } else {
        console.log('User profile is already complete, no redirection needed');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Reset the redirect flag if authentication state changes to true
  useEffect(() => {
    if (isAuthenticated) {
      redirectAttempted.current = false;
    }
  }, [isAuthenticated]);

  // Show loading state while checking authentication, but only for a limited time
  // Add a timeout to avoid infinite loading state
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    // If loading takes too long, force continue after 5 seconds
    const forceTimeout = setTimeout(() => {
      if (showLoading) {
        console.log('Force completing load after timeout');
        setShowLoading(false);
      }
    }, 5000); // 5 second maximum loading state
    
    // Update loading state from auth context
    if (!loading && initialLoadComplete.current) {
      setShowLoading(false);
    }
    
    return () => clearTimeout(forceTimeout);
  }, [loading, initialLoadComplete.current]);

  if (showLoading && (loading || (!initialLoadComplete.current))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verification de votre session...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated (and admin if required)
  return isAuthenticated && (!requireAdmin || (user && user.role === 'admin')) ? children : null;
};

// Add a route component for public routes that should redirect if authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect once if authenticated and not already redirected
    if (!loading && isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    }
    
    // Reset the redirect flag if authentication state changes to false
    if (!isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated, loading, navigate, location]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return !isAuthenticated ? children : null;
};

function App() {
  return (
    <Router future={router.future} basename={router.basename}>
      <AuthProvider>
        <NotificationsProvider>
        
          <div className="min-h-screen bg-gray-100">
            <ScrollToTop />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pro" element={<TlefliPRO />} />
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/complete-business-profile" element={<CompleteBusinessProfile />} />
              <Route path="/qr/:id" element={<QRScannerPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/items" element={<ItemsList />} />
                <Route path="/items/:id/verify" element={<VerifyItemPage />} /> {/* Make sure this comes before the generic item details route */}
                <Route path="/items/:id" element={<ItemDetails />} />
                <Route path="/items/:id/edit" element={<EditItem />} />
                <Route path="/report" element={<ReportItem />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute requireAdmin><Layout /></ProtectedRoute>}>
                <Route path="/admin/panel" element={<AdminPanel />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastContainer />
          </div>
        </NotificationsProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
