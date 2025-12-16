
export type User = {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Gerente' | 'Supervisor' | 'Vendedor' | 'Comprador';
};

export enum ProductKind {
  GOOD = 'GOOD',
  SERVICE = 'SERVICE',
}

export enum StockPolicy {
  FIFO = 'FIFO',
  LIFO = 'LIFO',
}

export enum WarehouseType {
  STORE = 'Armazém da Loja',
  GENERAL = 'Armazém Geral',
}

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
}

export interface StockLevel {
  warehouseId: string;
  quantity: number;
}

export interface ProductPackage {
  name: string; // ex: CX, GRD, UN
  factor: number; // ex: 12 (1 CX = 12 UN)
  ean: string;
  price?: number;
}

export interface ProductBatch {
  id: string;
  number: string;
  expiryDate: string;
  quantity: number;
  warehouseId: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  kind: ProductKind;
  trackStock: boolean;
  baseUnit: string; // ex: KG, L, M, UN
  stockPolicy?: StockPolicy;
  packages: ProductPackage[];
  stockLevels: StockLevel[];
  batches?: ProductBatch[];
  minPurchaseQuantity?: number; // Qtd mínima para venda
  minStockLevel?: number; // Stock de Segurança (Alerta)
}

export interface CartItem {
  id: string; // Unique identifier for the cart line item
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  selectedPackage: string; // e.g., 'CX'
  baseUnitQuantity: number; // Calculated total in base unit
  warehouseId: string;
}

export interface Delivery {
  orderId: string;
  driverName: string;
  deliveryTime: string;
  vehicle: {
    make: string;
    model: string;
    licensePlate: string;
  };
  tracking: {
    lat: number;
    lng: number;
  };
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
}
