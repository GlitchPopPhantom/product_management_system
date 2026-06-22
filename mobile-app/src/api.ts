import { createClient } from '@supabase/supabase-js';

// 1. Initialize the Supabase Client gatekeeper using Vercel environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables in Vercel configuration!");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Define internal typescript mappings for safety
export interface Category {
  id: number;
  name: string;
}

export interface Product {
  Id: number; // Matches the capital 'I' from your Supabase schema image
  "Product Name": string;
  Description: string;
  Price: number;
  Category_id: number;
  "Stock Quantity": number;
  "Product Image URL": string;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  categoriesAvailable: number;
  estimatedNetValue: number;
}

export const api = {
  // 1. Calculate dashboard metrics on-the-fly from live Supabase data
  getStats: async (): Promise<DashboardStats> => {
    // Fetch products and categories concurrently
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('Products').select('Price, Stock Quantity'),
      supabase.from('Categories').select('id', { count: 'exact', head: true })
    ]);

    if (productsRes.error) throw new Error(productsRes.error.message);
    if (categoriesRes.error) throw new Error(categoriesRes.error.message);

    const products = productsRes.data || [];
    const totalProducts = products.length;
    const categoriesAvailable = categoriesRes.count || 0;

    // Calculate Estimated Net Value: Sum of (Price * Stock Quantity)
    const estimatedNetValue = products.reduce((sum, item) => {
      const price = item['Price'] || 0;
      const stock = item['Stock Quantity'] || 0;
      return sum + (price * stock);
    }, 0);

    return {
      totalProducts,
      categoriesAvailable,
      estimatedNetValue
    };
  },

  // Add these inside your existing export const api = { ... } object:

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // 2. Get array of categories from the Categories table
  getCategories: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('Categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // 3. Fetch products with support for searching, category filtering, and ordering pipelines
  getProducts: async (search?: string, category?: string, sort?: string): Promise<Product[]> => {
    let query = supabase.from('Products').select('*');

    // Filter by category_id if provided
    if (category && category !== 'all') {
      query = query.eq('Category_id', parseInt(category));
    }

    // Text search against product names
    if (search) {
      query = query.ilike('Product Name', `%${search}%`);
    }

    // Handle ordering pipelines
    if (sort) {
      if (sort === 'price_asc') {
        query = query.order('Price', { ascending: true });
      } else if (sort === 'price_desc') {
        query = query.order('Price', { ascending: false });
      } else if (sort === 'name_asc') {
        query = query.order('Product Name', { ascending: true });
      } else {
        query = query.order('Id', { ascending: true }); // Default order
      }
    } else {
      query = query.order('Id', { ascending: true });
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as Product[]) || [];
  },

  // 4. Create new product entry in the database
  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const { data: newProduct, error } = await supabase
      .from('Products')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return newProduct;
  },

  // 5. Update an existing product settings row
  updateProduct: async (id: number, data: Partial<Product>): Promise<Product> => {
    const { data: updatedProduct, error } = await supabase
      .from('Products')
      .update(data)
      .eq('Id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updatedProduct;
  },

  // 6. Delete product execution
  deleteProduct: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('Products')
      .delete()
      .eq('Id', id);

    if (error) throw new Error(error.message);
  }
};
