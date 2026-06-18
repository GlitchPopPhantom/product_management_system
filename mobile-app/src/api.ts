const BASE_URL = 'https://task-master-6ou2.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
  };
};

export const api = {
  // Get dashboard metrics card metrics
  getStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${BASE_URL}/dashboard-stats/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load dashboard metrics');
    return res.json();
  },

  // Get categorized array of categories
  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${BASE_URL}/categories/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  },

  // Fetch products with support for native searching, filtering, and ordering pipelines
  getProducts: async (search?: string, category?: string, sort?: string): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (sort) params.append('ordering', sort); // Maps to views.py ordering_fields

    const res = await fetch(`${BASE_URL}/products/?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch product inventory');
    return res.json();
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const res = await fetch(`${BASE_URL}/products/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Validation error while saving product');
    }
    return res.json();
  },

  updateProduct: async (id: number, data: Partial<Product>): Promise<Product> => {
    const res = await fetch(`${BASE_URL}/products/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update product settings');
    return res.json();
  },

  deleteProduct: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE_URL}/products/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete product execution');
  }
};
