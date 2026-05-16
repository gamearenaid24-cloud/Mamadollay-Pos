export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'kasir' | 'owner';
  outlet_id: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  category_name: string;
  price: number;
  cost: number;
  qty: number;
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface CartItem extends Product {
  cartQty: number;
}
