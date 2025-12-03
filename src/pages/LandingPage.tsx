
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { Product } from '@/types';
import ProductCard from '@/components/products/ProductCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get('/produtos');
  return data;
};

const LandingPage = () => {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'], 
    queryFn: fetchProducts
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Filter products based on search term
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Catálogo de Produtos</h1>
        
        <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" aria-hidden="true" />
            </div>
            <input
                type="text"
                name="search"
                id="search"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm shadow-sm transition duration-150 ease-in-out"
                placeholder="Pesquisar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
                <div className="ml-3">
                    <p className="text-sm text-red-700">Ocorreu um erro ao carregar os produtos. Por favor, tente novamente mais tarde.</p>
                </div>
            </div>
        </div>
      )}

      {!isLoading && !error && filteredProducts?.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Não encontrámos nada para "{searchTerm}". Tente termos diferentes.</p>
            <button onClick={() => setSearchTerm('')} className="mt-4 text-sm font-semibold text-primary hover:text-blue-700">
                Limpar pesquisa
            </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
