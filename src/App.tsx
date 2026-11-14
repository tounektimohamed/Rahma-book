import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { validateFirestoreConnection } from './firebase/firebase';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { StoriesPage } from './pages/StoriesPage';
import { StoryDetailsPage } from './pages/StoryDetailsPage';
import { CustomizePage } from './pages/CustomizePage';
import { CartPage } from './pages/CartPage';
import { AdminPage } from './pages/AdminPage';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF9F2] text-[#443B3B] flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white rounded-3xl border border-[#EADFD7] p-8 space-y-4">
            <h1 className="text-xl font-bold">My Little Story</h1>
            <p className="text-sm text-[#706464]">
              حدث خطأ غير متوقع أثناء عرض الصفحة. يرجى إعادة التحميل.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold cursor-pointer"
            >
              إعادة التحميل
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    validateFirestoreConnection();
  }, []);

  return (
    <AppErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/stories" element={<StoriesPage />} />
                  <Route path="/stories/:id" element={<StoryDetailsPage />} />
                  <Route path="/customize" element={<CustomizePage />} />
                  <Route path="/customize/:storyId" element={<CustomizePage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </AppErrorBoundary>
  );
}
