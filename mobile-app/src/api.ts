import { createClient } from '@supabase/supabase-js';

// Read using Expo's public environment variable prefix
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials missing! Check your environment configuration.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ... keep the rest of your api object methods (getProducts, getCategories, etc.) exactly the same
// 1. Interfaces exactly matching your database screenshots
export interface Product {
  Id: number;                  // Matches 'Id' (capital I) from screenshot
  "Product Name": string;      // Matches 'Product Name'
  Description: string | null;  // Matches 'Description'
  Price: number;               // Matches 'Price'
  Category_id: number;         // Matches 'Category_id'
  "Stock Quantity": number;    // Matches 'Stock Quantity'
  "Product Image URL": string | null; // Matches 'Product Image URL'
  created_at?: string;         // Matches 'created_at'
}

export interface Category {
  Category_id: number;         // Matches 'Category_id' from screenshot
  Category_Name: string;       // Matches 'Category_Name' from screenshot
}

export interface DashboardStats {
  totalProducts: number;
  categoriesAvailable: number;
  estimatedNetValue: number;
}

// 2. Clear API functions matching case-sensitive columns
export const api = {
  // Fetches products with search text filtering, category mapping, and ordering keys
  async getProducts(search: string, selectedCategory: string, sortBy: string): Promise<Product[]> {
    let query = supabase.from('Products').select('*');

    // Filter by text search matching Product Name if provided
    if (search.trim()) {
      query = query.ilike('Product Name', `%${search.trim()}%`);
    }

    // Filter by exact Category ID match if selected
    if (selectedCategory) {
      query = query.eq('Category_id', parseInt(selectedCategory));
    }

    // Apply sorting logic cleanly using the passed variable
    if (sortBy === 'price_asc') {
      query = query.order('Price', { ascending: true });
    } else if (sortBy === 'price_desc') {
      query = query.order('Price', { ascending: false });
    } else if (sortBy === 'name_asc') {
      query = query.order('Product Name', { ascending: true });
    } else {
      // Default fallback ordering matches database Primary Key 'Id'
      query = query.order('Id', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Fetches category names and ids with correct capitalization mappings
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('Categories')
      .select('Category_id, Category_Name')
      .order('Category_id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Aggregates dashboard operational stats dynamically from server queries
  async getStats(): Promise<DashboardStats> {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('Products').select('Price, Stock Quantity'),
      supabase.from('Categories').select('Category_id', { count: 'exact', head: true })
    ]);

    if (productsRes.error) throw productsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    const products = productsRes.data || [];
    const totalProducts = products.length;
    const categoriesAvailable = categoriesRes.count || 0;

    // Calculate sum aggregation dynamically: Price * Quantity
    const estimatedNetValue = products.reduce((acc, curr) => {
      const price = curr.Price || 0;
      const qty = curr["Stock Quantity"] || 0;
      return acc + (price * qty);
    }, 0);

    return {
      totalProducts,
      categoriesAvailable,
      estimatedNetValue
    };
  },

  // Inserts a new row mapping straight to your explicit column identifiers
  async createProduct(payload: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('Products')
      .insert([payload]);

    if (error) throw error;
  },

  // Updates specific product metrics matching via the Primary Key row selector
  async updateProduct(id: number, payload: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('Products')
      .update(payload)
      .eq('Id', id); // Must be capital 'Id'

    if (error) throw error;
  },

  // Drops target product catalog rows directly from the table database
  async deleteProduct(id: number): Promise<void> {
    const { error } = await supabase
      .from('Products')
      .delete()
      .eq('Id', id); // Must be capital 'Id'

    if (error) throw error;
  }
};
