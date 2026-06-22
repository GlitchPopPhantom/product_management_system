export interface Product {
  Id: number;                  // Capital 'I'
  "Product Name": string;
  Description: string | null;
  Price: number;
  Category_id: number;         // Match exactly
  "Stock Quantity": number;
  "Product Image URL": string | null;
  created_at: string;
}

export interface Category {
  Category_id: number;         // Capital 'C'
  Category_Name: string;       // Capital 'C' and 'N'
}

export interface DashboardStats {
  total_products: number;
  total_categories: number;
  inventory_value: number;
}
