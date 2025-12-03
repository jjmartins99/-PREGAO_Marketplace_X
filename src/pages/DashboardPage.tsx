
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      <p className="mt-4 text-lg text-gray-600">
        Bem-vindo, <span className="font-semibold text-primary">{user?.name}</span>!
      </p>
      <p className="mt-2 text-gray-500">
        O seu perfil é: <span className="font-medium">{user?.role}</span>
      </p>
      <div className="mt-6">
        <button
          onClick={logout}
          className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors"
        >
          Terminar Sessão
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
