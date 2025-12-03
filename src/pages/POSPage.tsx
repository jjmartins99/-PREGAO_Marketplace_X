
import React, { useState, useCallback } from 'react';
import { Product } from '@/types';
import POSScanner from '@/components/pos/POSScanner';
import POSCart from '@/components/pos/POSCart';
import { mockProducts } from '@/mocks/data'; // Using mock data for demonstration

const POSPage = () => {
    const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

    const handleBarcodeScanned = useCallback((barcode: string) => {
        // In a real app, you would fetch the product from the API
        console.log(`Barcode scanned: ${barcode}`);
        const foundProduct = mockProducts.find(p => p.packages.some(pkg => pkg.ean === barcode));
        
        if (foundProduct) {
            console.log('Product found:', foundProduct.name);
            setScannedProduct(foundProduct);
        } else {
            alert('Produto não encontrado!');
            setScannedProduct(null); // Clear previous product if new one not found
        }
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Ponto de Venda (POS)</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Scanner</h2>
                    <POSScanner onBarcodeScanned={handleBarcodeScanned} />
                </div>
                <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
                     <h2 className="text-xl font-semibold mb-4">Carrinho</h2>
                     <POSCart initialProduct={scannedProduct} />
                </div>
            </div>
        </div>
    );
};

export default POSPage;
