
import React, { useState, useEffect } from 'react';
import { Product, CartItem, ProductPackage, WarehouseType } from '@/types';
import { PlusIcon, MinusIcon, TrashIcon, ExclamationTriangleIcon, ArrowsRightLeftIcon, TableCellsIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { mockProducts, mockWarehouses } from '@/mocks/data';

// Business rules for cart limits
const CART_LIMITS = {
  MAX_LINES: 10,
  MAX_QTY_PER_LINE: 50,
  MAX_TOTAL_VALUE: 500000, // 500,000 Kz
};

interface POSCartProps {
  initialProduct: Product | null;
}

interface MergeConflict {
  product: Product;
  selectedPackage: ProductPackage;
  existingItem: CartItem;
  alternativeWarehouseId: string;
  quantityToAdd: number;
}

// Sub-component to handle decimal inputs correctly
const QuantityInput = ({ 
    value, 
    onChange, 
    min, 
    step, 
    className,
    disabled
}: { 
    value: number, 
    onChange: (val: number) => void, 
    min: number, 
    step: string, 
    className?: string,
    disabled?: boolean
}) => {
    const [localValue, setLocalValue] = useState(value.toString());

    // Sync local value when prop changes externally (e.g. +/- buttons)
    useEffect(() => {
        // Only update local value if the numeric value actually changed
        // This prevents overwriting "1." with "1" while typing
        const parsedLocal = parseFloat(localValue);
        if (parsedLocal !== value) {
            setLocalValue(value.toString());
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValStr = e.target.value;
        setLocalValue(newValStr);
        
        if (newValStr === '') {
            onChange(0);
            return;
        }

        const parsed = parseFloat(newValStr);
        if (!isNaN(parsed)) {
            onChange(parsed);
        }
    };

    const handleBlur = () => {
        // On blur, force format to standard number string to clean up (e.g. "1." -> "1")
        setLocalValue(value.toString());
    };

    return (
        <input 
            type="number"
            min={min}
            step={step}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={className}
            disabled={disabled}
        />
    );
};

const getPriceForPackage = (product: Product, packageName: string): number => {
  const selectedPackage = product.packages.find(p => p.name === packageName);
  return selectedPackage?.price ?? product.price;
};

const POSCart: React.FC<POSCartProps> = ({ initialProduct }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [validationError, setValidationError] = useState<{ message: string; productId?: string } | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [mergeConflict, setMergeConflict] = useState<MergeConflict | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Validate items against stock on every render to ensure integrity
  const stockValidationErrors = items.reduce((acc, item) => {
    const fullProduct = mockProducts.find(p => p.id === item.productId);
    if (!fullProduct?.trackStock) return acc;

    // Calculate total quantity of this product in this warehouse across all cart lines
    const totalInCart = items
        .filter(i => i.productId === item.productId && i.warehouseId === item.warehouseId)
        .reduce((sum, i) => sum + i.baseUnitQuantity, 0);

    const stockLevel = fullProduct.stockLevels.find(s => s.warehouseId === item.warehouseId)?.quantity || 0;

    // Allow small float tolerance
    if (totalInCart > stockLevel + 0.0001) {
        acc[item.id] = `Stock insuficiente: ${totalInCart.toFixed(2)} / ${stockLevel} ${fullProduct.baseUnit}`;
    } else {
        // Check for orphan stock: remaining stock cannot be less than minPurchaseQuantity unless it is 0
        const remaining = stockLevel - totalInCart;
        const minPurchase = fullProduct.minPurchaseQuantity || 0;
        if (minPurchase > 0 && remaining > 0.0001 && remaining < minPurchase - 0.0001) {
            acc[item.id] = `Sobra inviável: ${remaining.toFixed(2)} < Mín (${minPurchase})`;
        }
    }
    return acc;
  }, {} as Record<string, string>);

  // Validate items against Minimum Purchase Quantity
  const minQtyValidationErrors = items.reduce((acc, item) => {
    const fullProduct = mockProducts.find(p => p.id === item.productId);
    if (!fullProduct?.minPurchaseQuantity) return acc;

    const minBase = fullProduct.minPurchaseQuantity;
    const currentBase = item.baseUnitQuantity; // quantity * factor

    // Tolerance for float comparison
    if (currentBase < minBase - 0.001) {
        const pkg = fullProduct.packages.find(p => p.name === item.selectedPackage);
        const minPackages = minBase / (pkg?.factor || 1);
        const displayMin = minPackages % 1 === 0 ? minPackages : minPackages.toFixed(2);
        
        acc[item.id] = `Qtd mínima: ${minBase} ${fullProduct.baseUnit} (~${displayMin} ${item.selectedPackage})`;
    }
    return acc;
  }, {} as Record<string, string>);

  const hasStockErrors = Object.keys(stockValidationErrors).length > 0;
  const hasMinQtyErrors = Object.keys(minQtyValidationErrors).length > 0;

  useEffect(() => {
    if (initialProduct) {
      addItem(initialProduct, initialProduct.packages[0].name);
    }
  }, [initialProduct]);

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  };

  // Helper function to validate stock availability across the cart
  const checkStockAvailability = (
    productId: string, 
    warehouseId: string, 
    requestedTotalBaseQty: number, 
    excludeItemId?: string
  ): { allowed: boolean; available: number; message?: string } => {
      const product = mockProducts.find(p => p.id === productId);
      if (!product || !product.trackStock) return { allowed: true, available: Infinity };

      const stockLevel = product.stockLevels.find(s => s.warehouseId === warehouseId);
      const availableStock = stockLevel?.quantity ?? 0;

      // Calculate quantity currently in cart for this product & warehouse (excluding the item being updated)
      const inCartQuantity = items
          .filter(item => item.productId === productId && item.warehouseId === warehouseId && item.id !== excludeItemId)
          .reduce((sum, item) => sum + item.baseUnitQuantity, 0);

      const totalRequired = inCartQuantity + requestedTotalBaseQty;

      if (totalRequired > availableStock + 0.0001) { // Float tolerance
          const warehouse = mockWarehouses.find(w => w.id === warehouseId);
          return {
              allowed: false,
              available: availableStock,
              message: `Stock insuficiente no ${warehouse?.name || warehouseId}. Disponível: ${availableStock} ${product.baseUnit}. Pedido total: ${totalRequired.toFixed(2)}.`
          };
      }

      // Check for orphan stock (remaining stock < minPurchaseQuantity)
      const remainingStock = availableStock - totalRequired;
      const minPurchase = product.minPurchaseQuantity || 0;
      
      if (minPurchase > 0 && remainingStock > 0.0001 && remainingStock < minPurchase - 0.0001) {
          return {
              allowed: false,
              available: availableStock,
              message: `Operação bloqueada: O stock restante (${remainingStock.toFixed(2)} ${product.baseUnit}) seria inferior ao mínimo de compra (${minPurchase} ${product.baseUnit}). Venda a totalidade ou ajuste a quantidade.`
          };
      }

      return { allowed: true, available: availableStock };
  };

  const addItem = (product: Product, selectedPackageName: string = product.packages[0].name) => {
    // Always work with the full product data to ensure latest stock levels
    const fullProduct = mockProducts.find(p => p.id === product.id);
    if (!fullProduct) {
        setValidationError({ message: "Produto não encontrado na base de dados." });
        return;
    }
    const selectedPackage = fullProduct.packages.find(p => p.name === selectedPackageName);
    if (!selectedPackage) return;

    setValidationError(null);

    // Calculate Quantity to Add based on Minimum Purchase
    const minBase = fullProduct.minPurchaseQuantity || 1;
    // For initial add, ensure we meet minimum.
    let quantityToAdd = 1;
    if (selectedPackage.factor * quantityToAdd < minBase) {
        quantityToAdd = Math.ceil(minBase / selectedPackage.factor);
    }
    
    const quantityToAddBase = quantityToAdd * selectedPackage.factor;

    // 1. Check if the item already exists in the cart (Same Product + Same Package)
    const existingItem = items.find(i => i.productId === fullProduct.id && i.selectedPackage === selectedPackageName);

    if (existingItem && fullProduct.trackStock) {
        // 2. Check if we can MERGE (add +quantityToAdd to existing warehouse)
        // Check total requirement (existing + new)
        const canMerge = checkStockAvailability(fullProduct.id, existingItem.warehouseId, quantityToAddBase);
        
        // 3. Check if we can SEPARATE (add new line from a DIFFERENT warehouse)
        const alternativeStock = fullProduct.stockLevels.find(sl => 
            sl.warehouseId !== existingItem.warehouseId && 
            checkStockAvailability(fullProduct.id, sl.warehouseId, quantityToAddBase).allowed
        );

        // 4. If BOTH are possible (or alternative exists), ask the user
        if (canMerge.allowed && alternativeStock) {
            setMergeConflict({
                product: fullProduct,
                selectedPackage: selectedPackage,
                existingItem: existingItem,
                alternativeWarehouseId: alternativeStock.warehouseId,
                quantityToAdd: quantityToAdd
            });
            return;
        }
    }

    // --- STANDARD ADD LOGIC (Executed if no conflict dialog is needed) ---
    executeAddItem(fullProduct, selectedPackage, undefined, quantityToAdd);
  };

  const executeAddItem = (fullProduct: Product, selectedPackage: ProductPackage, forcedWarehouseId?: string, quantity: number = 1) => {
    let warehouseIdToUse = forcedWarehouseId;

    if (!warehouseIdToUse) {
        if (fullProduct.trackStock) {
            // Smart Warehouse Selection:
            // 1. Try to use the warehouse of an existing identical item in the cart (to merge lines)
            const existingItem = items.find(i => i.productId === fullProduct.id && i.selectedPackage === selectedPackage.name);
            
            if (existingItem) {
                 const check = checkStockAvailability(fullProduct.id, existingItem.warehouseId, quantity * selectedPackage.factor);
                 if (check.allowed) {
                     warehouseIdToUse = existingItem.warehouseId;
                 }
            }
    
            // 2. If not found or full, find any warehouse with enough stock for this addition
            if (!warehouseIdToUse) {
                const validStock = fullProduct.stockLevels.find(sl => {
                    const check = checkStockAvailability(fullProduct.id, sl.warehouseId, quantity * selectedPackage.factor);
                    return check.allowed;
                });
                
                if (validStock) {
                    warehouseIdToUse = validStock.warehouseId;
                }
            }
    
            if (!warehouseIdToUse) {
                 const totalStock = fullProduct.stockLevels.reduce((acc, sl) => acc + sl.quantity, 0);
                 setValidationError({ 
                    message: `Sem stock disponível para adicionar ${fullProduct.name} (${selectedPackage.name}). Total no sistema: ${totalStock}.`,
                    productId: fullProduct.id
                });
                return;
            }
        } else {
            warehouseIdToUse = mockWarehouses[0]?.id;
        }
    }

    if (!warehouseIdToUse) {
        setValidationError({ message: "Nenhum armazém configurado." });
        return;
    }

    // GROUPING LOGIC: Check if item already exists in cart to just update quantity
    const existingItemIndex = items.findIndex(item => item.productId === fullProduct.id && item.selectedPackage === selectedPackage.name && item.warehouseId === warehouseIdToUse);

    if (existingItemIndex >= 0) {
      const currentItem = items[existingItemIndex];
      const newQuantity = currentItem.quantity + quantity;
      
      if (newQuantity > CART_LIMITS.MAX_QTY_PER_LINE) {
          setValidationError({ message: `Limite de ${CART_LIMITS.MAX_QTY_PER_LINE} unidades por linha.` });
          return;
      }

      // Validate Stock for the update (total quantity)
      const newTotalBase = newQuantity * selectedPackage.factor;
      // Note: we pass currentItem.id to exclude its OLD quantity from calculation, effectively checking the NEW total
      const stockCheck = checkStockAvailability(fullProduct.id, warehouseIdToUse, newTotalBase, currentItem.id);
      
      if (!stockCheck.allowed) {
          setValidationError({ message: stockCheck.message || "Stock insuficiente.", productId: fullProduct.id });
          return;
      }

      const newItems = [...items];
      newItems[existingItemIndex] = {
          ...currentItem,
          quantity: newQuantity,
          baseUnitQuantity: newTotalBase
      };
      setItems(newItems);

    } else {
      if (items.length >= CART_LIMITS.MAX_LINES) {
        setValidationError({ message: `Aviso: Limite de ${CART_LIMITS.MAX_LINES} linhas no carrinho atingido.` });
        return;
      }

      // Final check for new item
      const stockCheck = checkStockAvailability(fullProduct.id, warehouseIdToUse, quantity * selectedPackage.factor);
      if (!stockCheck.allowed) {
           setValidationError({ message: stockCheck.message || "Stock insuficiente.", productId: fullProduct.id });
           return;
      }

      const newItem: CartItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: fullProduct.id,
        productName: fullProduct.name,
        quantity: quantity,
        unitPrice: getPriceForPackage(fullProduct, selectedPackage.name),
        selectedPackage: selectedPackage.name,
        baseUnitQuantity: quantity * selectedPackage.factor,
        warehouseId: warehouseIdToUse,
      };
      setItems([...items, newItem]);
    }
  };

  const handleConfirmMerge = () => {
    if (!mergeConflict) return;
    executeAddItem(mergeConflict.product, mergeConflict.selectedPackage, mergeConflict.existingItem.warehouseId, mergeConflict.quantityToAdd);
    setMergeConflict(null);
  };

  const handleConfirmSeparate = () => {
    if (!mergeConflict) return;
    executeAddItem(mergeConflict.product, mergeConflict.selectedPackage, mergeConflict.alternativeWarehouseId, mergeConflict.quantityToAdd);
    setMergeConflict(null);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    // Allow 0 momentarily (e.g. while typing), checks min/stock later
    if (isNaN(newQuantity) || newQuantity < 0) return; 

    const itemIndex = items.findIndex(i => i.id === itemId);
    if(itemIndex === -1) return;
    const item = items[itemIndex];

    const fullProduct = mockProducts.find(p => p.id === item.productId);
    const pkg = fullProduct?.packages.find(p => p.name === item.selectedPackage);
    
    if (!fullProduct || !pkg) return;

    if (newQuantity > CART_LIMITS.MAX_QTY_PER_LINE) {
        setValidationError({ message: `Quantidade máxima de ${CART_LIMITS.MAX_QTY_PER_LINE} atingida.` });
        return;
    }

    const newBaseQty = newQuantity * pkg.factor;
    // Validate stock for the requested total quantity
    const stockCheck = checkStockAvailability(fullProduct.id, item.warehouseId, newBaseQty, itemId);

    if (!stockCheck.allowed) {
        setValidationError({ message: stockCheck.message || "Stock insuficiente.", productId: fullProduct.id });
        return; // Reject update if stock insufficient
    }

    setValidationError(null);

    const newItems = [...items];
    newItems[itemIndex] = {
        ...item,
        quantity: newQuantity,
        baseUnitQuantity: newBaseQty
    };
    setItems(newItems);
  };
  
  const updatePackage = (itemId: string, newPackageName: string) => {
    const itemIndex = items.findIndex(i => i.id === itemId);
    if(itemIndex === -1) return;
    const item = items[itemIndex];

    const fullProduct = mockProducts.find(p => p.id === item.productId);
    if (!fullProduct) return;

    const newSelectedPackage = fullProduct.packages.find(p => p.name === newPackageName);
    if (!newSelectedPackage) return;

    // Calculate new base qty for current item
    const newBaseQty = item.quantity * newSelectedPackage.factor;

    // Check for existing identical item to merge with
    const existingItemIndex = items.findIndex(i => 
        i.id !== itemId && 
        i.productId === item.productId && 
        i.warehouseId === item.warehouseId && 
        i.selectedPackage === newPackageName
    );

    if (existingItemIndex >= 0) {
        // MERGE LOGIC
        const existingItem = items[existingItemIndex];
        const mergedQty = existingItem.quantity + item.quantity;
        const mergedBaseQty = mergedQty * newSelectedPackage.factor;

        if (mergedQty > CART_LIMITS.MAX_QTY_PER_LINE) {
             setValidationError({ message: `A fusão dos itens excederia o limite de ${CART_LIMITS.MAX_QTY_PER_LINE} unidades por linha.` });
             return;
        }

        const stockLevel = fullProduct.stockLevels.find(s => s.warehouseId === item.warehouseId)?.quantity ?? 0;
        
        const otherItemsQty = items
            .filter(i => i.productId === fullProduct.id && i.warehouseId === item.warehouseId && i.id !== itemId && i.id !== existingItem.id)
            .reduce((acc, i) => acc + i.baseUnitQuantity, 0);

        if (otherItemsQty + mergedBaseQty > stockLevel) {
             setValidationError({ message: `Stock insuficiente para fundir os itens. Necessário: ${mergedBaseQty + otherItemsQty} ${fullProduct.baseUnit}.`, productId: fullProduct.id });
             return;
        }

        setValidationError(null);

        const newItems = items.filter(i => i.id !== itemId).map(i => {
            if (i.id === existingItem.id) {
                return {
                    ...i,
                    quantity: mergedQty,
                    baseUnitQuantity: mergedBaseQty
                };
            }
            return i;
        });
        setItems(newItems);

    } else {
        // STANDARD UPDATE
        const stockCheck = checkStockAvailability(fullProduct.id, item.warehouseId, newBaseQty, itemId);

        if (!stockCheck.allowed) {
            setValidationError({ message: stockCheck.message || "Stock insuficiente para a nova embalagem.", productId: fullProduct.id });
            return;
        }
        
        setValidationError(null);

        const newItems = [...items];
        newItems[itemIndex] = {
          ...item,
          selectedPackage: newPackageName,
          unitPrice: getPriceForPackage(fullProduct, newPackageName),
          baseUnitQuantity: newBaseQty,
        };
        setItems(newItems);
    }
  };

  const updateWarehouse = (itemId: string, newWarehouseId: string) => {
    const itemIndex = items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    const item = items[itemIndex];

    if (item.warehouseId === newWarehouseId) return;

    const fullProduct = mockProducts.find(p => p.id === item.productId);
    if (!fullProduct) return;

    // Check if destination warehouse has enough stock
    const stockCheck = checkStockAvailability(fullProduct.id, newWarehouseId, item.baseUnitQuantity, itemId);

    if (!stockCheck.allowed) {
        setValidationError({ 
            message: stockCheck.message || `Não é possível mover para este armazém: stock insuficiente.`,
            productId: fullProduct.id,
        });
        return;
    }

    setValidationError(null);

    // Check if we can merge with an existing item in the new warehouse
    const existingItemInNewWarehouse = items.find(i =>
        i.id !== itemId &&
        i.productId === item.productId &&
        i.selectedPackage === item.selectedPackage &&
        i.warehouseId === newWarehouseId
    );

    if (existingItemInNewWarehouse) {
        // Merge logic
        const mergedQty = existingItemInNewWarehouse.quantity + item.quantity;
        const mergedBaseQty = mergedQty * (fullProduct.packages.find(p => p.name === item.selectedPackage)?.factor || 1);
        
        if (mergedQty > CART_LIMITS.MAX_QTY_PER_LINE) {
             setValidationError({ message: `A fusão dos itens excederia o limite de ${CART_LIMITS.MAX_QTY_PER_LINE} unidades por linha.` });
             return;
        }
        
        const stockLevel = fullProduct.stockLevels.find(s => s.warehouseId === newWarehouseId)?.quantity ?? 0;
        const otherItemsQty = items
            .filter(i => i.productId === fullProduct.id && i.warehouseId === newWarehouseId && i.id !== itemId && i.id !== existingItemInNewWarehouse.id)
            .reduce((acc, i) => acc + i.baseUnitQuantity, 0);

         if (otherItemsQty + mergedBaseQty > stockLevel) {
             setValidationError({ message: `Stock insuficiente no novo armazém para fundir os itens.`, productId: fullProduct.id });
             return;
        }

        const updatedItems = items
            .map(i =>
                i.id === existingItemInNewWarehouse.id
                    ? {
                          ...i,
                          quantity: mergedQty,
                          baseUnitQuantity: mergedBaseQty,
                      }
                    : i
            )
            .filter(i => i.id !== itemId);
        setItems(updatedItems);
    } else {
        const newItems = [...items];
        newItems[itemIndex] = { ...item, warehouseId: newWarehouseId };
        setItems(newItems);
    }
  };

  const removeItem = (itemId: string) => {
    const itemToRemove = items.find(item => item.id === itemId);
    if (!itemToRemove) return;

    if (validationError && validationError.productId === itemToRemove.productId) {
      setValidationError(null);
    }

    setRemovingItemId(itemId);
    setTimeout(() => {
        setItems(currentItems => currentItems.filter(item => item.id !== itemId));
        setRemovingItemId(null);
    }, 300);
  };

  const handleFinalize = () => {
    if (hasStockErrors || hasMinQtyErrors) return;
    
    // In a real app, this would submit the order to the backend
    alert(`Venda finalizada com sucesso! Total: ${calculateTotal().toFixed(2)} Kz`);
    setItems([]);
    setValidationError(null);
  };
  
  const totalValue = calculateTotal();
  const totalValueExceeded = totalValue > CART_LIMITS.MAX_TOTAL_VALUE;

  // Filter items based on search term
  const filteredItems = items.filter(item => 
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* MERGE CONFLICT MODAL */}
      {mergeConflict && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm rounded-lg">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-200 animate-fadeInDown">
                <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                         <TableCellsIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Opções de Adição</h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    O produto <span className="font-semibold text-gray-800">{mergeConflict.product.name}</span> já está no carrinho via 
                    <span className="font-medium text-blue-600 ml-1">{mockWarehouses.find(w => w.id === mergeConflict.existingItem.warehouseId)?.name}</span>.
                </p>
                <p className="text-gray-600 text-sm mb-6">
                    Pretende juntar à linha existente ou criar uma nova linha a partir do 
                    <span className="font-medium text-green-600 ml-1">{mockWarehouses.find(w => w.id === mergeConflict.alternativeWarehouseId)?.name}</span>?
                </p>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleConfirmMerge}
                        className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <ArrowsRightLeftIcon className="h-5 w-5 mr-2" />
                        Fundir (Total: {mergeConflict.existingItem.quantity + mergeConflict.quantityToAdd})
                    </button>
                    <button 
                        onClick={handleConfirmSeparate}
                        className="flex items-center justify-center w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nova Linha Separada
                    </button>
                </div>
                 <button 
                    onClick={() => setMergeConflict(null)}
                    className="mt-4 text-xs text-gray-400 hover:text-gray-600 w-full text-center"
                >
                    Cancelar Operação
                </button>
            </div>
        </div>
      )}

      {validationError && (
          <div className="p-3 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 flex items-start animate-pulse border border-yellow-200" role="alert">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600 flex-shrink-0"/>
            <div>
                <span className="font-semibold block mb-1">Atenção</span>
                {validationError.message}
            </div>
          </div>
      )}

      {(hasStockErrors || hasMinQtyErrors) && !validationError && (
           <div className="p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50 flex items-start animate-pulse border border-red-200" role="alert">
             <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600 flex-shrink-0"/>
             <div>
                 <span className="font-semibold block mb-1">Erro de Validação</span>
                 Verifique os itens com erros no carrinho (stock insuficiente ou quantidade mínima não atingida).
             </div>
           </div>
      )}

      {/* SEARCH INPUT */}
      <div className="mb-3 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
        </div>
        <input
            type="text"
            placeholder="Filtrar itens no carrinho..."
            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition duration-150 ease-in-out shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-grow overflow-y-auto -mr-4 pr-4">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-10">O carrinho está vazio. Escaneie um produto para começar.</p>
        ) : filteredItems.length === 0 ? (
           <div className="text-center py-8">
                <MagnifyingGlassIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhum item encontrado para "{searchTerm}".</p>
           </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredItems.map((item, index) => {
                const isRemoving = item.id === removingItemId;
                const stockError = stockValidationErrors[item.id];
                const minQtyError = minQtyValidationErrors[item.id];
                
                const hasError = validationError?.productId === item.productId || !!stockError || !!minQtyError;
                const isLastItem = index === filteredItems.length - 1 && !isRemoving;
                const fullProduct = mockProducts.find(p => p.id === item.productId);
                
                const itemClasses = ['py-4 transition-all duration-300', isLastItem && items.length > 0 ? 'animate-fadeInDown' : '', isRemoving ? 'animate-fadeOutUp' : '', hasError ? 'cart-item-error -mx-4 px-4 rounded-md' : ''].filter(Boolean).join(' ');

                const warehouseOptions = mockWarehouses.filter(w => w.id === item.warehouseId || (fullProduct?.stockLevels.some(s => s.warehouseId === w.id && s.quantity > 0)));

                // Calculate dynamic min attribute for HTML validation
                const pkg = fullProduct?.packages.find(p => p.name === item.selectedPackage);
                const minBase = fullProduct?.minPurchaseQuantity || 1;
                
                const isMeasurable = ['KG', 'L', 'M', 'M2', 'M3'].includes(fullProduct?.baseUnit?.toUpperCase() || '');
                // Allow decimals only if it's the base unit package (factor 1) AND measurable
                const allowDecimals = isMeasurable && pkg?.factor === 1;

                let minPkgQty = Math.ceil(minBase / (pkg?.factor || 1));
                if (allowDecimals && minBase < 1) minPkgQty = minBase;

                return (
                  <li key={item.id} className={itemClasses}>
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                          <p className="font-semibold text-gray-800">{item.productName}</p>
                          <div className="flex items-center mt-1 space-x-2">
                              <span className="text-sm text-gray-600">{item.unitPrice.toFixed(2)} Kz</span>
                              {fullProduct && fullProduct.packages.length > 1 ? (
                                  <select value={item.selectedPackage} onChange={(e) => updatePackage(item.id, e.target.value)} className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary py-1">
                                      {fullProduct.packages.map(pkg => (<option key={pkg.name} value={pkg.name}>{pkg.name}</option>))}
                                  </select>
                              ) : (
                                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{item.selectedPackage}</span>
                              )}
                          </div>
                          {stockError && (
                               <div className="mt-1 text-xs text-red-600 font-medium flex items-center">
                                   <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                   {stockError}
                               </div>
                          )}
                          {minQtyError && (
                               <div className="mt-1 text-xs text-orange-600 font-medium flex items-center">
                                   <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                   {minQtyError}
                               </div>
                          )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                          <button onClick={() => updateQuantity(item.id, Math.max(minPkgQty, item.quantity - (allowDecimals ? 0.5 : 1)))} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex-shrink-0"><MinusIcon className="h-4 w-4"/></button>
                          
                          <QuantityInput
                            min={minPkgQty}
                            step={allowDecimals ? "0.01" : "1"}
                            value={item.quantity}
                            onChange={(val) => updateQuantity(item.id, val)}
                            className={`w-16 text-center border rounded-md text-sm py-1 focus:ring-primary focus:border-primary ${minQtyError ? 'border-orange-300 text-orange-700 bg-orange-50' : 'border-gray-300'}`}
                          />
                          
                          <button onClick={() => updateQuantity(item.id, item.quantity + (allowDecimals ? 0.5 : 1))} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex-shrink-0"><PlusIcon className="h-4 w-4"/></button>
                          <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 transition-colors ml-1"><TrashIcon className="h-5 w-5"/></button>
                      </div>
                    </div>
                    {fullProduct?.trackStock && (
                      <div className="mt-2 flex flex-wrap items-center gap-y-2">
                        <label htmlFor={`warehouse-${item.id}`} className="text-xs text-gray-500 mr-2">Armazém:</label>
                        <select
                          id={`warehouse-${item.id}`}
                          value={item.warehouseId}
                          onChange={(e) => updateWarehouse(item.id, e.target.value)}
                          className="text-xs border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary py-1 pr-8 max-w-[200px]"
                        >
                          {warehouseOptions.map(wh => {
                              const stock = fullProduct.stockLevels.find(s => s.warehouseId === wh.id)?.quantity || 0;
                              return (
                                <option key={wh.id} value={wh.id}>
                                    {wh.name} ({stock} {fullProduct.baseUnit})
                                </option>
                              );
                          })}
                        </select>
                      </div>
                    )}
                  </li>
                );
            })}
          </ul>
        )}
      </div>
      <div className="border-t pt-4 mt-4">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total:</span>
          <span className={totalValueExceeded ? 'text-red-600' : 'text-gray-900'}>{totalValue.toFixed(2)} Kz</span>
        </div>
        {totalValueExceeded && <p className="text-red-600 text-sm mt-1">Atenção: O valor total excede o limite de {CART_LIMITS.MAX_TOTAL_VALUE.toFixed(2)} Kz.</p>}
        <button 
          disabled={items.length === 0 || totalValueExceeded || !!validationError || !!mergeConflict || hasStockErrors || hasMinQtyErrors}
          onClick={handleFinalize}
          className="w-full mt-4 bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md">
          Finalizar Venda
        </button>
      </div>
    </div>
  );
};

const MemoizedPOSCart = React.memo(POSCart);
export default MemoizedPOSCart;
