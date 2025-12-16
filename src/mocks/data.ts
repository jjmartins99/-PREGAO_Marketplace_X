
import { User, Product, ProductKind, StockPolicy, Delivery, Warehouse, WarehouseType } from '@/types';

export const mockUsers: User[] = [
  { id: 1, name: 'Admin PRegão', email: 'admin@pregao.co.ao', role: 'Admin' },
  { id: 2, name: 'Vendedor Teste', email: 'vendedor@pregao.co.ao', role: 'Vendedor' },
  { id: 3, name: 'Gerente Loja', email: 'gerente@pregao.co.ao', role: 'Gerente' },
];

export const mockWarehouses: Warehouse[] = [
  { id: 'wh_1', name: 'Armazém Principal', type: WarehouseType.GENERAL },
  { id: 'wh_2', name: 'Loja A - Frente de Loja', type: WarehouseType.STORE },
];

export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Sumo de Laranja Compal 1L',
    description: 'Sumo 100% natural, sem adição de açúcar.',
    price: 850.00,
    imageUrl: 'https://picsum.photos/seed/juice/400/300',
    kind: ProductKind.GOOD,
    trackStock: true,
    baseUnit: 'UN',
    stockPolicy: StockPolicy.FIFO,
    minPurchaseQuantity: 12,
    minStockLevel: 150, // ALERTA: Total é 120 (100+20), logo deve disparar notificação
    packages: [
      { name: 'UN', factor: 1, ean: '1111111111111', price: 850.00 },
      { name: 'CX', factor: 6, ean: '1111111111112', price: 5000.00 },
    ],
    stockLevels: [
      { warehouseId: 'wh_1', quantity: 100 },
      { warehouseId: 'wh_2', quantity: 20 },
    ],
    batches: [
      { id: 'b1', number: 'L001-2024', expiryDate: '2024-12-31', quantity: 50, warehouseId: 'wh_1' },
      { id: 'b2', number: 'L002-2025', expiryDate: '2025-06-15', quantity: 50, warehouseId: 'wh_1' },
      { id: 'b3', number: 'L003-LOJA', expiryDate: '2024-11-20', quantity: 20, warehouseId: 'wh_2' },
    ]
  },
  {
    id: 'prod_2',
    name: 'Arroz Agulha 5kg',
    description: 'Arroz de grão longo, ideal para pratos do dia a dia.',
    price: 4500.00,
    imageUrl: 'https://picsum.photos/seed/rice/400/300',
    kind: ProductKind.GOOD,
    trackStock: true,
    baseUnit: 'KG',
    stockPolicy: StockPolicy.LIFO,
    minStockLevel: 20, // OK: Total é 50
    packages: [
      { name: 'SACO', factor: 5, ean: '2222222222222' },
    ],
    stockLevels: [
      { warehouseId: 'wh_1', quantity: 50 },
    ],
    batches: [
        { id: 'b4', number: 'ARZ-099', expiryDate: '2026-01-01', quantity: 50, warehouseId: 'wh_1' }
    ]
  },
  {
    id: 'prod_3',
    name: 'Serviço de Instalação AC',
    description: 'Instalação de unidade de ar condicionado. Duração média: 120 min.',
    price: 25000.00,
    imageUrl: 'https://picsum.photos/seed/ac/400/300',
    kind: ProductKind.SERVICE,
    trackStock: false,
    baseUnit: 'SERV',
    packages: [
      { name: 'SERV', factor: 1, ean: '3333333333333' },
    ],
    stockLevels: [],
  },
  {
    id: 'prod_4',
    name: 'Água Mineral 1.5L',
    description: 'Água pura e cristalina de nascente.',
    price: 250.00,
    imageUrl: 'https://picsum.photos/seed/water/400/300',
    kind: ProductKind.GOOD,
    trackStock: true,
    baseUnit: 'UN',
    stockPolicy: StockPolicy.FIFO,
    minStockLevel: 500, // ALERTA: Total é 300 (240+60)
    packages: [
      { name: 'UN', factor: 1, ean: '4444444444444' },
      { name: 'FARDO', factor: 6, ean: '4444444444445', price: 1400.00 },
    ],
    stockLevels: [
      { warehouseId: 'wh_1', quantity: 240 },
      { warehouseId: 'wh_2', quantity: 60 },
    ],
    batches: []
  }
];

export const mockDelivery: Delivery = {
    orderId: 'order123',
    driverName: 'João Silva',
    deliveryTime: '14:30',
    vehicle: {
        make: 'Toyota',
        model: 'Hilux',
        licensePlate: 'LD-12-34-AB'
    },
    tracking: {
        lat: -8.8368, // Luanda, Angola
        lng: 13.2343
    },
    status: 'IN_TRANSIT'
};
