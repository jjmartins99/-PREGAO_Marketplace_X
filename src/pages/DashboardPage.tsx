
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/apiClient';
import { Product } from '@/types';
import { 
  ExclamationTriangleIcon, 
  CubeIcon, 
  ArrowTrendingUpIcon, 
  ArrowPathIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';

// Função para buscar produtos da API
const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get('/produtos');
  return data;
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Filtra produtos com stock abaixo do nível mínimo configurado
  const lowStockProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      if (!product.trackStock || product.minStockLevel === undefined || product.minStockLevel === null) return false;
      
      const totalStock = (product.stockLevels || []).reduce((sum, sl) => sum + sl.quantity, 0);
      return totalStock < product.minStockLevel;
    });
  }, [products]);

  // Se o utilizador não estiver disponível, não renderiza o dashboard (segurança extra)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Permissões para ações de gestão
  const canManageInventory = user.role === 'Admin' || user.role === 'Gerente';

  return (
    <div className="space-y-6 pb-12 animate-fadeInDown">
      {/* Header Profile Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="mt-1 text-gray-500">
                Olá, <span className="font-semibold text-primary">{user.name}</span>. Aqui está o resumo da sua operação hoje.
            </p>
            <div className="mt-3 flex items-center space-x-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                    {user.role}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                <span className="text-xs text-gray-400 font-medium">Sessão Ativa</span>
            </div>
        </div>
        <div className="mt-6 sm:mt-0 flex space-x-3">
             <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-semibold rounded-lg text-red-600 bg-white hover:bg-red-50 transition-all duration-200"
            >
                Terminar Sessão
            </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-blue-50 text-primary mr-4">
                      <CubeIcon className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Total Produtos</p>
                      <h3 className="text-2xl font-black text-gray-900">{isLoading ? '...' : products?.length}</h3>
                  </div>
              </div>
          </div>
          
          <div className={`bg-white p-6 rounded-xl shadow-sm border transition-colors ${lowStockProducts.length > 0 ? 'border-amber-200' : 'border-gray-100'}`}>
              <div className="flex items-center">
                  <div className={`p-3 rounded-xl mr-4 ${lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                      <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Alertas Stock</p>
                      <h3 className={`text-2xl font-black ${lowStockProducts.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {isLoading ? '...' : lowStockProducts.length}
                      </h3>
                  </div>
              </div>
          </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-green-50 text-green-600 mr-4">
                      <ArrowTrendingUpIcon className="h-6 w-6" />
                  </div>
                  <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Vendas (Hoje)</p>
                      <h3 className="text-2xl font-black text-gray-900">0.00 Kz</h3>
                  </div>
              </div>
          </div>
      </div>

      {/* DEDICATED SECTION: Critical Stock Alerts */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg mr-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Inventário Crítico</h2>
                    <p className="text-xs text-gray-500">Produtos abaixo do nível de segurança</p>
                </div>
            </div>
            {lowStockProducts.length > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                    Ação Necessária
                </span>
            )}
        </div>
        
        <div className="p-0">
            {isLoading ? (
                <div className="p-12 text-center">
                    <ArrowPathIcon className="h-8 w-8 text-gray-300 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500 text-sm font-medium">A analisar níveis de inventário...</p>
                </div>
            ) : isError ? (
                <div className="p-12 text-center text-red-500">
                    <ExclamationTriangleIcon className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">Erro ao carregar dados de stock.</p>
                </div>
            ) : lowStockProducts.length === 0 ? (
                <div className="p-16 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-green-50 rounded-full mb-4">
                        <CheckBadgeIcon className="h-12 w-12 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Stock Operacional</h3>
                    <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                        Excelente! Todos os seus produtos estão com stock saudável.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Produto</th>
                                <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock Atual</th>
                                <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mínimo</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {lowStockProducts.map(product => {
                                const totalStock = (product.stockLevels || []).reduce((sum, sl) => sum + sl.quantity, 0);
                                const minLevel = product.minStockLevel || 0;
                                const isCritical = totalStock === 0;

                                return (
                                    <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 mr-3">
                                                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">{product.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`text-sm font-black ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                                                {totalStock} <span className="text-[10px] font-medium text-gray-400">{product.baseUnit}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm font-bold text-gray-500">
                                                {minLevel} <span className="text-[10px] font-medium text-gray-400">{product.baseUnit}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {canManageInventory && (
                                                <Link 
                                                    to="/import" 
                                                    className="inline-flex items-center px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                                                >
                                                    <ArrowPathIcon className="h-3 w-3 mr-1.5" />
                                                    Repor Stock
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        
        {lowStockProducts.length > 0 && (
            <div className="bg-amber-50 px-6 py-3 border-t border-amber-100">
                <p className="text-[10px] text-amber-700 font-semibold italic text-center">
                    Aviso: Níveis de stock insuficientes podem levar à perda de oportunidades de venda.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
