export interface Person {
  id: string;
  customId?: string;
  name: string;
  photo?: string;
  initialDeposit: number;
  balance: number;
  purchases: Purchase[];
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  stock: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Purchase {
  id: string;
  personId: string;
  date: Date;
  items: PurchaseItem[];
  total: number;
}