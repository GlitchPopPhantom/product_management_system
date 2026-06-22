import { createClient } from '@supabase/supabase-js';

// Read using Expo's public environment variable prefix
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials missing! Check your environment configuration.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TypeScript Interfaces matching your lowercase id column
export interface Product {
  id: number;                           // CHANGED TO LOWERCASE
  "Product Name": string;               
  Description: string | null;           
  Price: number;                        
  Category_id: number;                  
  "Stock Quantity": number;             
  "Product Image URL": string | null;   
  created_at?: string;                  
}

export interface Category {
  Category_id: number;                  
  Category_Name: string;                
}

export interface DashboardStats {
  totalProducts: number;
  categoriesAvailable: number;
  estimatedNetValue: number;
}

export const api = {
  // Fetches products with search filtering, category filtering, and sorting
  async getProducts(search: string, selectedCategory: string, sortBy: string): Promise<Product[]> {
    let query = supabase.from('Products').select('*');

    if (search && search.trim()) {
      query = query.ilike('Product Name', `%${search.trim()}%`);
    }

    if (selectedCategory) {
      query = query.eq('Category_id', parseInt(selectedCategory));
    }

    // Sorting conditions using lowercase id
    if (sortBy === 'price_asc') {
      query = query.order('Price', { ascending: true });
    } else if (sortBy === 'price_desc') {
      query = query.order('Price', { ascending: false });
    } else if (sortBy === 'name_asc') {
      query = query.order('Product Name', { ascending: true });
    } else {
      query = query.order('id', { ascending: true }); // CHANGED TO LOWERCASE
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Fetches categories sorted by their primary key ID
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('Categories')
      .select('Category_id, Category_Name')
      .order('Category_id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Calculates totals and net values directly using the correct database keys
  async getStats(): Promise<DashboardStats> {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('Products').select('Price, Stock Quantity'),
      supabase.from('Categories').select('Category_id', { count: 'exact', head: true })
    ]);

    if (productsRes.error) throw productsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    const products = productsRes.data || [];
    
    const estimatedNetValue = products.reduce((sum, item) => {
      const price = item.Price || 0;
      const qty = item['Stock Quantity'] || 0;
      return sum + (price * qty);
    }, 0);

    return {
      totalProducts: products.length,
      categoriesAvailable: categoriesRes.count || 0,
      estimatedNetValue
    };
  },

  // Adds a new item to the Products table
  async createProduct(payload: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('Products')
      .insert([payload]);

    if (error) throw error;
  },

  // Updates an item targeting the lowercase primary key 'id'
  async updateProduct(id: number, payload: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('Products')
      .update(payload)
      .eq('id', id); // CHANGED TO LOWERCASE

    if (error) throw error;
  },

  // Deletes an item targeting the lowercase primary key 'id'
  async deleteProduct(id: number): Promise<void> {
    const { error } = await supabase
      .from('Products')
      .delete()
      .eq('id', id); // CHANGED TO LOWERCASE

    if (error) throw error;
  }
};
