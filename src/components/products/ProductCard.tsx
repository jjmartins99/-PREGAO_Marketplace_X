
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Product, ProductPackage, ProductBatch } from '@/types';
import { 
  ShoppingCartIcon, 
  EyeIcon, 
  XMarkIcon, 
  MinusIcon, 
  PlusIcon, 
  ScaleIcon, 
  ExclamationCircleIcon, 
  BuildingOfficeIcon, 
  MagnifyingGlassIcon, 
  BoltIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, CalendarIcon } from '@heroicons/react/24/solid';
import { mockWarehouses } from '@/mocks/data';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ProductPackage>(product.packages[0]);
  
  const isMeasurableUnit = ['KG', 'L', 'M', 'M2', 'M3'].includes(product.baseUnit.toUpperCase());
  const allowDecimals = isMeasurableUnit && selectedPackage.factor === 1;

  const minQtyBase = product.minPurchaseQuantity || 1;
  const minQtyInput = allowDecimals 
    ? (product.minPurchaseQuantity || 0.1) 
    : Math.max(1, Math.ceil(minQtyBase / (selectedPackage.factor || 1)));

  const [quantity, setQuantity] = useState<number | string>(minQtyInput);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  const closeModal = () => {
      setIsOpen(false);
      setModalSearchTerm('');
  };
  const openModal = () => setIsOpen(true);

  const getNumericQuantity = () => {
      if (typeof quantity === 'number') return quantity;
      if (typeof quantity === 'string') {
          const parsed = parseFloat(quantity);
          return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
  };

  const generateBarcodeImage = (text: string) => {
      return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${text}&scale=3&includetext&backgroundcolor=ffffff&padding=10`;
  };

  // Helper para determinar o estado da validade do lote
  const getBatchStatus = (expiryDateStr: string) => {
      const expiry = new Date(expiryDateStr);
      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
          return { label: 'Expirado', class: 'text-red-700 bg-red-100', iconColor: 'text-red-500' };
      } else if (diffDays <= 30) {
          return { label: 'Expira em breve', class: 'text-amber-700 bg-amber-100', iconColor: 'text-amber-500' };
      } else {
          return { label: 'Válido', class: 'text-green-700 bg-green-100', iconColor: 'text-green-500' };
      }
  };

  useEffect(() => {
    if (isOpen) {
      setQuantity(minQtyInput);
      setError(null);
      if (product.trackStock && product.stockLevels.length > 0) {
          const bestWarehouse = [...product.stockLevels].sort((a, b) => b.quantity - a.quantity)[0];
          setSelectedWarehouseId(bestWarehouse.warehouseId);
      } else {
          setSelectedWarehouseId('');
      }
    }
  }, [isOpen, product.trackStock, product.stockLevels, minQtyInput]);

  useEffect(() => {
      setQuantity(minQtyInput);
  }, [selectedPackage, minQtyInput]);

  useEffect(() => {
      const numQty = typeof quantity === 'string' ? (parseFloat(quantity) || 0) : quantity;
      if (numQty === 0 && quantity !== 0 && quantity !== '0') return; 

      if (numQty < minQtyInput) {
          if (numQty !== 0) setError(`A quantidade mínima para esta embalagem é ${minQtyInput}.`);
          return;
      }

      if (product.trackStock) {
          if (selectedWarehouseId) {
              const stockLevel = product.stockLevels.find(s => s.warehouseId === selectedWarehouseId);
              const availableQty = stockLevel?.quantity || 0;
              const requestedBaseQty = numQty * selectedPackage.factor;
              if (requestedBaseQty > availableQty) {
                  const warehouseName = mockWarehouses.find(w => w.id === selectedWarehouseId)?.name || 'Armazém';
                  setError(`Stock insuficiente em ${warehouseName}.`);
              } else {
                  setError(null);
              }
          }
      } else {
          setError(null);
      }
  }, [quantity, selectedPackage, selectedWarehouseId, product.trackStock, product.stockLevels, minQtyInput]);

  const filteredPackages = product.packages.filter(pkg => 
    modalSearchTerm === '' || 
    product.id.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    pkg.ean.includes(modalSearchTerm) ||
    pkg.name.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const filteredBatches = product.batches?.filter(batch => 
    modalSearchTerm === '' ||
    batch.number.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    batch.id.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const displayPrice = selectedPackage.price ?? (product.price * selectedPackage.factor);
  const unitPrice = displayPrice / (selectedPackage.factor || 1);

  const handleIncrement = () => {
      const current = getNumericQuantity();
      setQuantity(allowDecimals ? parseFloat((current + 0.5).toFixed(2)) : current + 1);
  };
  
  const handleDecrement = () => {
      const current = getNumericQuantity();
      setQuantity(allowDecimals ? parseFloat(Math.max(0.1, current - 0.5).toFixed(2)) : Math.max(minQtyInput, current - 1));
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    if (valStr === '') { setQuantity(''); return; }
    if (allowDecimals) setQuantity(valStr);
    else {
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > 0) setQuantity(Math.floor(val));
    }
  };

  const handleAddToCart = () => {
      const numQty = getNumericQuantity();
      if (numQty < minQtyInput) return;
      console.log(`Adicionando ao carrinho: ${numQty}x ${product.name}`);
      closeModal();
  };

  const totalStock = product.stockLevels.reduce((acc, s) => acc + s.quantity, 0);
  const hasGlobalStock = !product.trackStock || totalStock > 0;

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultPkg = product.packages[0];
    const minPurchaseBase = product.minPurchaseQuantity || 1;
    const quickQty = Math.ceil(minPurchaseBase / defaultPkg.factor);
    alert(`Compra rápida: ${quickQty}x ${product.name} (${defaultPkg.name})`);
  };

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
        <div onClick={openModal} className="cursor-pointer group relative">
           <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover" />
           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
           {!hasGlobalStock && (
             <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Esgotado</div>
           )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 onClick={openModal} className="text-lg font-semibold text-gray-800 truncate cursor-pointer hover:text-primary">{product.name}</h3>
          <p className="text-sm text-gray-500 mt-1 h-10 overflow-hidden line-clamp-2">{product.description}</p>
          
          <div className="mt-auto pt-4 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
               <span className="text-xl font-bold text-gray-900">{product.price.toFixed(2)} Kz</span>
            </div>
            <button onClick={handleQuickBuy} disabled={!hasGlobalStock} className="w-full flex justify-center items-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-primary hover:bg-blue-800 transition-all disabled:bg-gray-400 mb-0.5">
                <BoltIcon className="h-4 w-4 mr-2" /> Comprar Agora
            </button>
            <button onClick={handleQuickBuy} disabled={!hasGlobalStock} className="w-full flex justify-center items-center px-4 py-2 border border-green-600 text-green-700 hover:bg-green-50 text-sm font-medium rounded-md transition-colors disabled:border-gray-300 disabled:text-gray-400">
                <ShoppingCartIcon className="h-4 w-4 mr-2" /> Adicionar
            </button>
            <button onClick={openModal} className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <EyeIcon className="h-4 w-4 mr-2 text-gray-500" /> Detalhes
            </button>
          </div>
        </div>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex justify-between items-start border-b pb-4 mb-4">
                    <div>
                        <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">{product.name}</Dialog.Title>
                        <p className="text-xs text-gray-500 mt-1">ID: <span className="font-mono">{product.id}</span></p>
                    </div>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-500 transition-colors"><XMarkIcon className="h-6 w-6" /></button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                        <img src={product.imageUrl} alt={product.name} className="w-full rounded-lg object-cover shadow-sm h-48" />
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex flex-col mb-3">
                                <p className="text-sm text-gray-500 mb-1">Preço ({selectedPackage.name})</p>
                                <p className="text-2xl font-bold text-primary">{displayPrice.toFixed(2)} Kz</p>
                                <div className="mt-1 flex items-center text-xs text-gray-600">
                                    <ScaleIcon className="h-3.5 w-3.5 mr-1" />
                                    {unitPrice.toFixed(2)} Kz / {product.baseUnit}
                                </div>
                            </div>
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">Embalagens Disponíveis</h4>
                                <div className="space-y-2">
                                    {product.packages.map((pkg) => (
                                        <div key={pkg.name} onClick={() => setSelectedPackage(pkg)} className={`cursor-pointer rounded-lg border p-2 transition-all ${selectedPackage.name === pkg.name ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'border-gray-200 bg-white hover:bg-gray-100'}`}>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-medium">{pkg.name} {pkg.factor > 1 && `(x${pkg.factor})`}</span>
                                                <span className="font-bold">{(pkg.price ?? product.price * pkg.factor).toFixed(2)} Kz</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                     </div>
                     
                     <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div>
                            <h4 className="font-semibold text-xs text-gray-900 uppercase tracking-wider mb-1 flex items-center">
                                <ExclamationCircleIcon className="h-4 w-4 mr-1 text-gray-400" /> Descrição
                            </h4>
                            <p className="text-sm text-gray-600">{product.description}</p>
                        </div>

                        {/* SECÇÃO ENHANCED: LOTES E VALIDADE */}
                        {product.batches && product.batches.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-xs text-gray-900 uppercase tracking-wider flex items-center">
                                        <CalendarDaysIcon className="h-4 w-4 mr-1 text-primary" /> Lotes e Validade
                                    </h4>
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                        {filteredBatches?.length} Lote(s)
                                    </span>
                                </div>
                                <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Lote</th>
                                                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Validade</th>
                                                <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200 text-xs">
                                            {filteredBatches?.length === 0 ? (
                                                <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-500">Nenhum lote.</td></tr>
                                            ) : (
                                                filteredBatches?.map((batch) => {
                                                    const status = getBatchStatus(batch.expiryDate);
                                                    const warehouse = mockWarehouses.find(w => w.id === batch.warehouseId);
                                                    
                                                    return (
                                                        <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-3 py-2">
                                                                <div className="font-semibold text-gray-900">{batch.number}</div>
                                                                <div className="text-[10px] text-gray-500 flex items-center">
                                                                    <BuildingOfficeIcon className="h-3 w-3 mr-0.5" /> {warehouse?.name || 'Geral'}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className={`flex items-center font-medium ${status.iconColor}`}>
                                                                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                                                                    {batch.expiryDate}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${status.class}`}>
                                                                    {status.label}
                                                                </span>
                                                            </td>
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
                            <h4 className="font-semibold text-xs text-gray-900 uppercase tracking-wider mb-2 flex items-center">
                                <MagnifyingGlassIcon className="h-4 w-4 mr-1 text-gray-400" /> Localizar
                            </h4>
                            <input
                                type="text"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-primary focus:border-primary"
                                placeholder="Filtrar por EAN ou Lote..."
                                value={modalSearchTerm}
                                onChange={(e) => setModalSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        {product.trackStock && (
                            <div>
                                <h4 className="font-semibold text-xs text-gray-900 uppercase tracking-wider mb-2 flex items-center">
                                    <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400" /> Stock por Armazém
                                </h4>
                                <div className="space-y-2">
                                    {product.stockLevels.map((stock) => {
                                        const warehouse = mockWarehouses.find(w => w.id === stock.warehouseId);
                                        const isSelected = selectedWarehouseId === stock.warehouseId;
                                        return (
                                            <div key={stock.warehouseId} onClick={() => setSelectedWarehouseId(stock.warehouseId)} className={`flex justify-between items-center p-2.5 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                                <div className="text-xs">
                                                    <span className="font-bold text-gray-900">{warehouse?.name || stock.warehouseId}</span>
                                                    <div className="text-[10px] text-gray-500">{warehouse?.type}</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-sm">{stock.quantity}</span>
                                                    <span className="text-[10px] text-gray-500 ml-1">{product.baseUnit}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                     </div>
                  </div>

                  <div className="mt-8 border-t border-gray-100 pt-4">
                     {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-3 border border-red-100 flex items-center text-xs text-red-700 font-medium">
                            <ExclamationCircleIcon className="h-4 w-4 mr-2 text-red-400" /> {error}
                        </div>
                     )}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center border border-gray-300 rounded-md bg-white">
                                <button onClick={handleDecrement} className="p-2 hover:bg-gray-100 rounded-l-md"><MinusIcon className="h-4 w-4 text-gray-600" /></button>
                                <input type="text" value={quantity} onChange={handleQuantityChange} className="w-12 text-center border-none p-1 text-sm font-bold focus:ring-0" />
                                <button onClick={handleIncrement} className="p-2 hover:bg-gray-100 rounded-r-md"><PlusIcon className="h-4 w-4 text-gray-600" /></button>
                            </div>
                            <span className="text-xs text-gray-500 font-medium uppercase">{selectedPackage.name}</span>
                        </div>
                        <button onClick={handleAddToCart} disabled={!!error} className="inline-flex justify-center rounded-md border border-transparent bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-800 focus:outline-none transition-all disabled:bg-gray-300">
                            <ShoppingCartIcon className="h-5 w-5 mr-2" /> Adicionar ao Carrinho
                        </button>
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
