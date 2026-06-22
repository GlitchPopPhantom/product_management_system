import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Safely attempts to read keys from Expo's config object first, falling back to process.env
const SUPABASE_URL = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  '';

const SUPABASE_ANON_KEY = 
  Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials missing! Check your environment configuration.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface Product {
  id: number;
  product_name: string;
  description: string | null;
  price: number;
  category_id: number;
  stock_quantity: number;
  product_image_url: string | null;
  created_at?: string;
}

export interface Category {
  category_id: number;
  category_name: string;
}

export interface DashboardStats {
  totalProducts: number;
  categoriesAvailable: number;
  estimatedNetValue: number;
}

export const api = {
  // Fetches products with uppercase table mapping and search/sort queries
  async getProducts(search: string, selectedCategory: string, sortBy: string): Promise<Product[]> {
    let query = supabase.from('Products').select('*');

    if (search && search.trim()) {
      query = query.ilike('product_name', `%${search.trim()}%`);
    }

    if (selectedCategory) {
      query = query.eq('category_id', parseInt(selectedCategory));
    }

    if (sortBy === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sortBy === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (sortBy === 'name_asc') {
      query = query.order('product_name', { ascending: true });
    } else {
      query = query.order('id', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Fetches categories from uppercase table
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('Categories')
      .select('category_id, category_name')
      .order('category_id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Generates analytics metrics from upper-cased database tables
  async getStats(): Promise<DashboardStats> {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('Products').select('price, stock_quantity'),
      supabase.from('Categories').select('category_id', { count: 'exact', head: true })
    ]);

    if (productsRes.error) throw productsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    const products = productsRes.data || [];
    
    const estimatedNetValue = products.reduce((sum, item) => {
      const p = item.price || 0;
      const q = item.stock_quantity || 0;
      return sum + (p * q);
    }, 0);

    return {
      totalProducts: products.length,
      categoriesAvailable: categoriesRes.count || 0,
      estimatedNetValue
    };
  },

  async createProduct(payload: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('Products')
      .insert([payload]);

    if (error) throw error;
  },

  async updateProduct(id: number, payload: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from('Products')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteProduct(id: number): Promise<void> {
    const { error } = await supabase
      .from('Products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
