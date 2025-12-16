
import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Product, ProductPackage } from '@/types';
import { ShoppingCartIcon, EyeIcon, XMarkIcon, MinusIcon, PlusIcon, ScaleIcon, ExclamationCircleIcon, BuildingOfficeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { mockWarehouses } from '@/mocks/data';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  // Inicializa com a primeira embalagem disponível (geralmente a unidade base)
  const [selectedPackage, setSelectedPackage] = useState<ProductPackage>(product.packages[0]);
  
  // Verifica se é uma unidade de medida que permite fracionamento (Peso/Volume)
  const isMeasurableUnit = ['KG', 'L', 'M', 'M2', 'M3'].includes(product.baseUnit.toUpperCase());
  // Permite decimais apenas se for unidade mensurável E estiver selecionada a unidade base (fator 1)
  const allowDecimals = isMeasurableUnit && selectedPackage.factor === 1;

  // Calcula a quantidade mínima para a embalagem selecionada
  const minQtyBase = product.minPurchaseQuantity || 1;
  // Se permitir decimais, usa o valor exato (ex: 0.5), caso contrário arredonda para cima (ex: 1)
  const minQtyInput = allowDecimals 
    ? (product.minPurchaseQuantity || 0.1) 
    : Math.max(1, Math.ceil(minQtyBase / (selectedPackage.factor || 1)));

  // Estado da quantidade pode ser número ou string para permitir input vazio e decimais durante a digitação
  const [quantity, setQuantity] = useState<number | string>(minQtyInput);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Estado para pesquisa dentro do modal
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  const closeModal = () => {
      setIsOpen(false);
      setModalSearchTerm(''); // Limpa pesquisa ao fechar
  };
  const openModal = () => setIsOpen(true);

  // Helper para obter quantidade numérica segura
  const getNumericQuantity = () => {
      if (typeof quantity === 'number') return quantity;
      if (typeof quantity === 'string') {
          const parsed = parseFloat(quantity);
          return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
  };

  // Função helper para gerar a URL da imagem do código de barras
  const generateBarcodeImage = (text: string) => {
      return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${text}&scale=3&includetext&backgroundcolor=ffffff&padding=10`;
  };

  // Inicialização ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setQuantity(minQtyInput);
      setError(null);
      
      // Seleciona automaticamente o armazém com maior stock se houver tracking
      if (product.trackStock && product.stockLevels.length > 0) {
          const bestWarehouse = [...product.stockLevels].sort((a, b) => b.quantity - a.quantity)[0];
          setSelectedWarehouseId(bestWarehouse.warehouseId);
      } else {
          setSelectedWarehouseId('');
      }
    }
  }, [isOpen, product.trackStock, product.stockLevels, minQtyInput]);

  // Reseta a quantidade quando a embalagem muda
  useEffect(() => {
      setQuantity(minQtyInput);
  }, [selectedPackage, minQtyInput]);

  // Validação em Tempo Real
  useEffect(() => {
      // Parse quantity locally for effect dependency stability
      const numQty = typeof quantity === 'string' ? (parseFloat(quantity) || 0) : quantity;

      // Se estiver vazio (a digitar), não valida ainda, exceto se for 0 explícito
      if (numQty === 0 && quantity !== 0 && quantity !== '0') {
          return; 
      }

      if (numQty < minQtyInput) {
          if (numQty !== 0) { 
             setError(`A quantidade mínima para esta embalagem é ${minQtyInput}.`);
          }
          return;
      }

      if (product.trackStock) {
          if (selectedWarehouseId) {
              const stockLevel = product.stockLevels.find(s => s.warehouseId === selectedWarehouseId);
              const availableQty = stockLevel?.quantity || 0;
              const requestedBaseQty = numQty * selectedPackage.factor;

              if (requestedBaseQty > availableQty) {
                  const warehouseName = mockWarehouses.find(w => w.id === selectedWarehouseId)?.name || 'Armazém';
                  setError(`Stock insuficiente em ${warehouseName}. (Solicitado: ${requestedBaseQty.toFixed(2)} ${product.baseUnit}, Disponível: ${availableQty} ${product.baseUnit})`);
              } else {
                  setError(null);
              }
          } else {
               setError(null);
          }
      } else {
          setError(null);
      }
  }, [quantity, selectedPackage, selectedWarehouseId, product.trackStock, product.stockLevels, minQtyInput, product.baseUnit]);

  // Lógica de filtragem baseada no termo de pesquisa
  const isProductIdMatch = product.id.toLowerCase().includes(modalSearchTerm.toLowerCase());

  const filteredPackages = product.packages.filter(pkg => 
    modalSearchTerm === '' || 
    isProductIdMatch ||
    pkg.ean.includes(modalSearchTerm) ||
    pkg.name.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const filteredBatches = product.batches?.filter(batch => 
    modalSearchTerm === '' ||
    isProductIdMatch ||
    batch.number.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    batch.id.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  // Calcula o preço a ser exibido com base na embalagem selecionada
  const displayPrice = selectedPackage.price ?? (product.price * selectedPackage.factor);

  // Calcula o preço por unidade base (útil para comparar embalagens)
  const unitPrice = displayPrice / (selectedPackage.factor || 1);

  const handleIncrement = () => {
      const current = getNumericQuantity();
      let next;
      if (allowDecimals) next = parseFloat((current + 0.5).toFixed(2));
      else next = current + 1;
      setQuantity(next);
  };
  
  const handleDecrement = () => {
      const current = getNumericQuantity();
      let next;
      if (allowDecimals) next = parseFloat(Math.max(0.1, current - 0.5).toFixed(2));
      else next = Math.max(minQtyInput, current - 1);
      setQuantity(next);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    if (valStr === '') {
        setQuantity('');
        return;
    }
    
    if (allowDecimals) {
        // Permite digitar livremente (incluindo "1.") para inputs decimais
        setQuantity(valStr);
    } else {
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > 0) {
            setQuantity(Math.floor(val));
        }
    }
  };

  const handleAddToCart = () => {
      const numQty = getNumericQuantity();

      if (numQty < minQtyInput) {
          setError(`A quantidade mínima para esta embalagem é ${minQtyInput}.`);
          return;
      }

      if (product.trackStock) {
          if (!selectedWarehouseId) {
              setError("Por favor, selecione um armazém.");
              return;
          }
          const stockLevel = product.stockLevels.find(s => s.warehouseId === selectedWarehouseId);
          const availableQty = stockLevel?.quantity || 0;
          const requestedBaseQty = numQty * selectedPackage.factor;

          if (requestedBaseQty > availableQty) {
              return; // Erro já deve estar visível
          }
      }

      console.log(`Adicionando ${numQty}x ${product.name} - ${selectedPackage.name} ao carrinho do armazém ${selectedWarehouseId}. Total: ${(displayPrice * numQty).toFixed(2)}`);
      closeModal();
  };

  // Calculate global stock availability for the Buy Now button state
  const totalStock = product.stockLevels.reduce((acc, s) => acc + s.quantity, 0);
  const hasGlobalStock = !product.trackStock || totalStock > 0;

  // Função para compra rápida (botão na frente do cartão)
  const handleQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 1. Default Package (First one)
    const defaultPkg = product.packages[0];
    
    // 2. Minimum Quantity Calculation
    const minPurchaseBase = product.minPurchaseQuantity || 1;
    // Calculate required package count (e.g., if Min=12 and Pkg=6, we need 2 packages)
    const quickQty = Math.ceil(minPurchaseBase / defaultPkg.factor);
    
    let whId = '';

    if (product.trackStock) {
        // 3. Find warehouse with enough stock for the required amount
        const requiredBaseQty = quickQty * defaultPkg.factor;
        
        const bestStock = product.stockLevels
            .filter(sl => sl.quantity >= requiredBaseQty)
            .sort((a, b) => b.quantity - a.quantity)[0];
        
        if (!bestStock) {
            alert(`Stock insuficiente para compra rápida de ${product.name}.\nNecessário: ${requiredBaseQty} ${product.baseUnit}\nDisponível Global: ${totalStock} ${product.baseUnit}`);
            return;
        }
        whId = bestStock.warehouseId;
    }

    const price = defaultPkg.price ?? (product.price * defaultPkg.factor);
    const totalPrice = price * quickQty;
    
    alert(`[Simulação] Adicionado ao carrinho:\n${quickQty}x ${defaultPkg.name} de ${product.name}\nTotal: ${totalPrice.toFixed(2)} Kz\n(Armazém: ${mockWarehouses.find(w => w.id === whId)?.name || 'Geral'})`);
    console.log(`[Quick Buy] Adicionado ${quickQty}x ${product.name} (${defaultPkg.name}) ao carrinho.`);
  };

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
        <div onClick={openModal} className="cursor-pointer group relative">
           <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
           {!hasGlobalStock && (
             <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
               Esgotado
             </div>
           )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 onClick={openModal} className="text-lg font-semibold text-gray-800 truncate cursor-pointer hover:text-primary">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1 h-10 overflow-hidden line-clamp-2">{product.description}</p>
          
          <div className="mt-auto pt-4 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
               <span className="text-xl font-bold text-gray-900">{product.price.toFixed(2)} Kz</span>
            </div>
            
            <button 
                onClick={handleQuickBuy}
                disabled={!hasGlobalStock}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                Adicionar ao Carrinho
            </button>
            
            <button
                onClick={openModal}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
            >
                <EyeIcon className="h-4 w-4 mr-2 text-gray-500" />
                Ver Detalhes
            </button>
          </div>
        </div>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-start border-b pb-4 mb-4">
                    <div>
                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                        {product.name}
                        </Dialog.Title>
                        <p className="text-xs text-gray-500 mt-1">ID Interno: <span className="font-mono">{product.id}</span></p>
                    </div>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <img src={product.imageUrl} alt={product.name} className="w-full rounded-lg object-cover shadow-sm h-64" />
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex flex-col mb-3">
                                <p className="text-sm text-gray-500 mb-1">Preço por {selectedPackage.name}</p>
                                <div className="flex flex-col">
                                    <p className="text-3xl font-bold text-primary">{displayPrice.toFixed(2)} Kz</p>
                                    <div className="mt-2 flex items-center text-sm text-gray-600 bg-white border border-gray-200 rounded px-2 py-1 w-fit">
                                        <ScaleIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>
                                            {unitPrice.toFixed(2)} Kz / <span className="font-medium text-gray-800">{product.baseUnit}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                             <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full mb-4 ${product.kind === 'GOOD' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {product.kind === 'GOOD' ? 'Produto Físico' : 'Serviço'}
                            </span>

                            <div className="mt-2">
                                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">Selecione a Embalagem</h4>
                                <div className="flex flex-col space-y-2">
                                    {product.packages.map((pkg) => {
                                        const isSelected = selectedPackage.name === pkg.name;
                                        const pkgPrice = pkg.price ?? (product.price * pkg.factor);
                                        const pkgUnitPrice = pkgPrice / pkg.factor;

                                        return (
                                            <div
                                                key={pkg.name}
                                                onClick={() => setSelectedPackage(pkg)}
                                                className={`relative flex cursor-pointer rounded-lg border p-3 shadow-sm focus:outline-none transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border-primary bg-blue-50 ring-1 ring-primary'
                                                        : 'border-gray-200 bg-white hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex flex-1 flex-col">
                                                    <div className="flex justify-between items-center">
                                                        <span className={`block text-sm font-medium ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                                            {pkg.name}
                                                            {pkg.factor > 1 && <span className="ml-1 text-gray-500 font-normal">(x{pkg.factor})</span>}
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="block text-sm font-bold text-gray-900">{pkgPrice.toFixed(2)} Kz</span>
                                                            <span className="block text-xs text-gray-500 font-normal">
                                                                {pkgUnitPrice.toFixed(2)} Kz / {product.baseUnit}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-1 flex items-center justify-between">
                                                        <span className="text-xs text-gray-500 flex items-center bg-gray-100 px-1.5 py-0.5 rounded">
                                                            EAN: <span className="font-mono ml-1 text-gray-700">{pkg.ean}</span>
                                                        </span>
                                                        {isSelected && (
                                                            <CheckCircleIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                     </div>
                     
                     <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wider mb-1">Descrição</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                        </div>

                        <div>
                             <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wider mb-2">Código de Barras</h4>
                             <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                 <img
                                     src={generateBarcodeImage(selectedPackage.ean)}
                                     alt={`Barcode ${selectedPackage.ean}`}
                                     className="max-w-full h-20 object-contain"
                                 />
                                 <p className="mt-1 text-xs text-gray-500">
                                     {selectedPackage.name} ({selectedPackage.ean})
                                 </p>
                             </div>
                        </div>

                        {/* Área de Pesquisa Local */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                placeholder="Filtrar por EAN ou Lote/ID..."
                                value={modalSearchTerm}
                                onChange={(e) => setModalSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        {product.trackStock && (
                            <div className="mt-6">
                                <div className="flex justify-between items-end mb-3">
                                    <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wider">Disponibilidade de Stock</h4>
                                    {product.stockLevels.length > 0 && (
                                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            Global: <span className="text-gray-900 font-bold ml-1">{product.stockLevels.reduce((acc, s) => acc + s.quantity, 0)} {product.baseUnit}</span>
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {product.stockLevels.length > 0 ? (
                                        product.stockLevels.map((stock) => {
                                            const warehouse = mockWarehouses.find(w => w.id === stock.warehouseId);
                                            const isSelected = selectedWarehouseId === stock.warehouseId;
                                            const qtyInPackage = Math.floor(stock.quantity / selectedPackage.factor);
                                            
                                            // Ajuste visual para unidades fracionadas
                                            let stockDisplay;
                                            if (allowDecimals) {
                                                stockDisplay = stock.quantity.toFixed(2);
                                            } else {
                                                stockDisplay = stock.quantity.toString();
                                            }
                                            
                                            return (
                                                <div 
                                                    key={stock.warehouseId}
                                                    onClick={() => {
                                                        setSelectedWarehouseId(stock.warehouseId);
                                                    }}
                                                    className={`group flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                                        isSelected 
                                                            ? 'border-primary bg-blue-50 ring-1 ring-primary shadow-sm' 
                                                            : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center">
                                                        <div className={`p-2 rounded-full mr-3 transition-colors ${isSelected ? 'bg-white text-primary' : 'bg-gray-100 text-gray-500 group-hover:bg-white'}`}>
                                                            <BuildingOfficeIcon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <span className={`text-sm font-medium block ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                {warehouse?.name || stock.warehouseId}
                                                            </span>
                                                            <span className="text-xs text-gray-500">{warehouse?.type || 'Armazém'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`font-bold text-sm block ${stock.quantity === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                                            {stockDisplay} <span className="text-xs font-normal text-gray-500">{product.baseUnit}</span>
                                                        </span>
                                                         {selectedPackage.factor > 1 && stock.quantity > 0 && (
                                                            <span className="text-xs text-gray-500 block">
                                                                ~ {qtyInPackage} {selectedPackage.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex items-center justify-center text-red-600">
                                            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                                            <span className="font-medium text-sm">Stock indisponível</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {product.batches && product.batches.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wider mb-2">Lotes e Validade</h4>
                                <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Armazém</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 text-xs">
                                            {filteredBatches?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-3 py-4 text-center text-gray-500">Nenhum lote encontrado.</td>
                                                </tr>
                                            ) : (
                                                filteredBatches?.map((batch) => {
                                                    const warehouse = mockWarehouses.find(w => w.id === batch.warehouseId);
                                                    return (
                                                        <tr key={batch.id} className="hover:bg-gray-50">
                                                            <td className="px-3 py-2 font-medium text-gray-900">{batch.number}</td>
                                                            <td className="px-3 py-2 text-gray-600">{batch.expiryDate}</td>
                                                            <td className="px-3 py-2 text-gray-500">{warehouse?.name || '-'}</td>
                                                            <td className="px-3 py-2 text-right text-gray-600 font-medium">{batch.quantity}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="font-semibold text-sm text-gray-900 uppercase tracking-wider mb-2">Resumo de Códigos</h4>
                             <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qtd Base</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">EAN</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200 text-xs">
                                        {filteredPackages.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-3 py-4 text-center text-gray-500">Nenhuma embalagem encontrada para o termo.</td>
                                            </tr>
                                        ) : (
                                            filteredPackages.map((pkg, idx) => (
                                                <tr 
                                                    key={idx} 
                                                    className={`${pkg.name === selectedPackage.name ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                                                    onClick={() => setSelectedPackage(pkg)}
                                                >
                                                    <td className="px-3 py-2 font-medium text-gray-900">
                                                        {pkg.name}
                                                        {pkg.name === selectedPackage.name && <span className="ml-2 text-blue-600 font-bold">✓</span>}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-600">{pkg.factor}</td>
                                                    <td className="px-3 py-2 font-mono text-gray-500">{pkg.ean}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                             </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 border-t border-gray-100 pt-4">
                     {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-3 border border-red-100 animate-fadeInDown">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Atenção</h3>
                                    <div className="mt-1 text-sm text-red-700">
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                     )}
                     
                     {minQtyInput > (allowDecimals ? 0.1 : 1) && !error && (
                        <div className="mb-4 rounded-md bg-orange-50 p-3 border border-orange-100">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationCircleIcon className="h-5 w-5 text-orange-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-orange-800">Quantidade Mínima</h3>
                                    <div className="mt-1 text-sm text-orange-700">
                                        <p>A venda mínima deste produto é de {minQtyInput} {selectedPackage.name}.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                     )}

                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                                Quantidade:
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-md">
                                <button 
                                    onClick={handleDecrement}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-l-md transition-colors"
                                >
                                    <MinusIcon className="h-4 w-4" />
                                </button>
                                {allowDecimals ? (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            id="quantity"
                                            value={quantity}
                                            onChange={handleQuantityChange}
                                            className="w-20 text-center border-x-0 border-y-0 p-2 text-gray-900 focus:ring-0 sm:text-sm"
                                        />
                                        <span className="absolute right-1 top-2 text-xs text-gray-400 pointer-events-none">
                                            {product.baseUnit}
                                        </span>
                                    </div>
                                ) : (
                                    <input
                                        type="number"
                                        id="quantity"
                                        min={minQtyInput}
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        className="w-16 text-center border-none p-2 text-gray-900 focus:ring-0 sm:text-sm"
                                    />
                                )}
                                <button 
                                    onClick={handleIncrement}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-r-md transition-colors"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                                onClick={handleAddToCart}
                                disabled={!!error || (product.trackStock && !selectedWarehouseId)}
                            >
                                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                                Adicionar ao Carrinho
                            </button>
                        </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default ProductCard;
