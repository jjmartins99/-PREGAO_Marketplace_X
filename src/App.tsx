
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SearchProvider } from './contexts/SearchContext';
import ProtectedRoute from './components/common/ProtectedRoute';

const queryClient = new QueryClient();

// Lazy loading Layout Components
const Header = lazy(() => import('./components/common/Header'));

// Lazy loading Page Components
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const POSPage = lazy(() => import('./pages/POSPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const DeliveryTrackingPage = lazy(() => import('./pages/DeliveryTrackingPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SearchProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500 font-medium">A carregar plataforma PREGÃO...</div>}>
              <Header />
              <main className="container mx-auto p-4">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pos"
                    element={
                      <ProtectedRoute roles={['Vendedor', 'Supervisor']}>
                        <POSPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/import"
                    element={
                      <ProtectedRoute roles={['Gerente', 'Admin']}>
                        <ImportPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/delivery"
                    element={
                      <ProtectedRoute>
                        <DeliveryTrackingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute roles={['Admin']}>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="*" element={<div className="text-center p-8">Página não encontrada</div>} />
                </Routes>
              </main>
            </Suspense>
          </BrowserRouter>
        </SearchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
