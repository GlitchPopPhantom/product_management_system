export interface Category {
  id: string; // UUID
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string; // Django Decimal field transfers as a string to prevent precision loss
  stock_quantity: number;
  image_url: string | null;
  category: string; // Category UUID string
  category_name?: string;
  created_at: string;
}

export interface DashboardStats {
  total_products: number;
  total_categories: number;
  inventory_value: number;
}
