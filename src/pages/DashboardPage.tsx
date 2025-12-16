
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/apiClient';
import { Product } from '@/types';
import { ExclamationTriangleIcon, CubeIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

// Função para buscar produtos (reutilizada do serviço)
const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get('/produtos');
  return data;
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Filtra produtos com stock baixo (Memoized para performance)
  const lowStockAlerts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      // Ignora se não rastreia stock ou não tem nível mínimo definido
      if (!product.trackStock || product.minStockLevel === undefined || product.minStockLevel === null) return false;
      
      const totalStock = (product.stockLevels || []).reduce((sum, sl) => sum + sl.quantity, 0);
      return totalStock < product.minStockLevel;
    });
  }, [products]);

  // Verifica se o utilizador tem permissão para repor stock (Importar)
  const canRepositionStock = user?.role === 'Admin' || user?.role === 'Gerente';

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="mt-2 text-gray-600">
                Bem-vindo de volta, <span className="font-semibold text-primary">{user?.name}</span>!
            </p>
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mt-2">
                {user?.role}
            </span>
        </div>
        <div className="mt-4 sm:mt-0">
             <button
                onClick={logout}
                className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors border border-red-200 hover:bg-red-50 px-4 py-2 rounded-md"
            >
                Terminar Sessão
            </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-primary">
              <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-50 text-primary mr-4">
                      <CubeIcon className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-sm text-gray-500 font-medium">Total de Produtos</p>
                      <h3 className="text-2xl font-bold text-gray-900">{isLoading ? '-' : products?.length}</h3>
                  </div>
              </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
              <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-50 text-yellow-600 mr-4">
                      <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-sm text-gray-500 font-medium">Alertas de Stock</p>
                      <h3 className="text-2xl font-bold text-gray-900">{isLoading ? '-' : lowStockAlerts.length}</h3>
                  </div>
              </div>
          </div>

           <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
                      <ArrowTrendingUpIcon className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-sm text-gray-500 font-medium">Vendas Hoje</p>
                      <h3 className="text-2xl font-bold text-gray-900">0 Kz</h3>
                  </div>
              </div>
          </div>
      </div>

      {/* Stock Notifications Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                Notificações de Stock
            </h2>
        </div>
        
        {isLoading ? (
             <div className="p-8 text-center text-gray-500">A verificar níveis de stock...</div>
        ) : lowStockAlerts.length === 0 ? (
             <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <CubeIcon className="h-12 w-12 text-gray-300 mb-2" />
                <p>Tudo operacional! Nenhum produto abaixo do nível mínimo.</p>
             </div>
        ) : (
            <div className="divide-y divide-gray-100">
                {lowStockAlerts.map(product => {
                    const totalStock = (product.stockLevels || []).reduce((sum, sl) => sum + sl.quantity, 0);
                    // Garante que minLevel é um número válido, fallback para 0
                    const minLevel = typeof product.minStockLevel === 'number' ? product.minStockLevel : 0;
                    const deficit = minLevel - totalStock;
                    
                    return (
                        <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-4">
                                    <ExclamationTriangleIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900">{product.name}</h4>
                                    <p className="text-xs text-gray-500">ID: {product.id} | Unidade: {product.baseUnit}</p>
                                    <div className="mt-1 flex items-center space-x-2 text-sm">
                                        <span className="text-red-600 font-medium">Atual: {totalStock}</span>
                                        <span className="text-gray-400">/</span>
                                        <span className="text-gray-600">Mínimo: {minLevel}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-3 sm:mt-0 flex items-center">
                                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 mr-4">
                                    Défice: {deficit}
                                </span>
                                {canRepositionStock && (
                                    <Link to="/import" className="text-sm font-medium text-primary hover:text-blue-700">
                                        Repor Stock &rarr;
                                    </Link>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
