
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { Product } from '@/types';
import ProductCard from '@/components/products/ProductCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearch } from '@/hooks/useSearch';

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get('/produtos');
  return data;
};

const LandingPage = () => {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'], 
    queryFn: fetchProducts
  });

  const { searchTerm, setSearchTerm } = useSearch();

  // Filter products based on search term
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Catálogo de Produtos</h1>
        {/* Search Input removed from here as it is now in Header */}
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
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="mt-4 text-sm font-semibold text-primary hover:text-blue-700">
                    Limpar pesquisa
                </button>
            )}
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