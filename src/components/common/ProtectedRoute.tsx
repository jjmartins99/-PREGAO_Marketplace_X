import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: User['role'][];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="text-center p-8">A verificar autenticação...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // User is authenticated but does not have the required role
    return <Navigate to="/dashboard" replace state={{ error: "Acesso não autorizado" }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
