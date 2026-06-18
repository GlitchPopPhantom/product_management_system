import React, { useEffect, useState } from 'react';

// ==========================================
// 1. CONFIGURATION & TYPES
// ==========================================
const BASE_URL = 'https://task-master-6ou2.onrender.com/api';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  image_url: string | null;
  category: string;
  category_name?: string;
  created_at: string;
}

interface DashboardStats {
  total_products: number;
  total_categories: number;
  inventory_value: number;
}

// Helper to bundle authentication headers
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
  };
};

// ==========================================
// MAIN APP COMPONENT (Handles Page Switching)
// ==========================================
export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Core Dashboard Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Filtering & Tool States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [uiError, setUiError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Field States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: 0,
    category: '',
    image_url: ''
  });

  // Reload data automatically whenever search/filter criteria shifts
  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, search, selectedCategory, sortBy]);

  const loadDashboardData = async () => {
    try {
      setUiError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (sortBy) params.append('ordering', sortBy);

      const [prodRes, catRes, statRes] = await Promise.all([
        fetch(`${BASE_URL}/products/?${params.toString()}`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/categories/`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/dashboard-stats/`, { headers: getHeaders() })
      ]);

      if (!prodRes.ok || !catRes.ok || !statRes.ok) {
        throw new Error('Backend data synch failing.');
      }

      const productsData = await prodRes.json();
      const categoriesData = await catRes.json();
      const statsData = await statRes.json();

      setProducts(productsData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (err: any) {
      setUiError(err.message || 'Error communicating with database fields.');
    }
  };

  // ==========================================
  // AUTHENTICATION LOGIC
  // ==========================================
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = isRegistering ? '/register/' : '/login/';

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication credentials rejected.');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setProducts([]);
    setStats(null);
  };

  // ==========================================
  // INVENTORY PRODUCT CRUD LOGIC
  // ==========================================
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', stock_quantity: 0, category: categories[0]?.id || '', image_url: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      category: product.category,
      image_url: product.image_url || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return setUiError('Product Name is required.');
    if (parseFloat(formData.price) <= 0 || isNaN(parseFloat(formData.price))) return setUiError('Price must be greater than 0.');
    if (formData.stock_quantity < 0) return setUiError('Stock cannot be negative.');
    if (!formData.category) return setUiError('Category field validation required.');

    try {
      const url = editingProduct ? `${BASE_URL}/products/${editingProduct.id}/` : `${BASE_URL}/products/`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to preserve modifications to inventory records.');

      setIsModalOpen(false);
      loadDashboardData();
    } catch (err: any) {
      setUiError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this product permanently?')) {
      try {
        const res = await fetch(`${BASE_URL}/products/${id}/`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok) throw new Error('Removal request failed.');
        loadDashboardData();
      } catch (err: any) {
        setUiError(err.message);
      }
    }
  };

  // ==========================================
  // RENDER INTERFACE CORRESPONDING TO STATE
  // ==========================================
  if (!token) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleAuthSubmit} style={{ background: '#fff', padding: '32px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>{isRegistering ? 'Create Account' : 'Dashboard Login'}</h2>
          
          {authError && <div style={{ padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{authError}</div>}
          
          <label style={{ display: 'block', marginBottom: '16px' }}>
            Username
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
          </label>

          <label style={{ display: 'block', marginBottom: '24px' }}>
            Password
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }} />
          </label>

          <button type="submit" style={{ width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '16px' }}>
            {isRegistering ? 'Sign Up' : 'Log In'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '14px', margin: 0, color: '#64748b' }}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }} style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 500 }}>
              {isRegistering ? 'Log In' : 'Sign Up'}
            </span>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto', color: '#1e293b' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: 0 }}>Product Management System</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleOpenCreateModal} style={{ padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            + Add Product
          </button>
          <button onClick={handleLogout} style={{ padding: '10px 16px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </header>

      {uiError && <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', marginBottom: '16px', borderRadius: '4px' }}>{uiError}</div>}

      {/* KPI Dashboard Summary Card Matrix */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Total Products</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{stats?.total_products || 0}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Total Categories</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{stats?.total_categories || 0}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#64748b', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Inventory Value</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#059669' }}>
            ₦{(stats?.inventory_value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </section>

      {/* Searching / Filtering Toolbar Components */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search product names..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ padding: '10px 14px', width: '280px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
        />
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}>
          <option value="">Sort Configuration</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
        </select>
      </div>

      {/* Product Content Rows Layout Grid */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
              <th style={{ padding: '14px' }}>Visual</th>
              <th style={{ padding: '14px' }}>Item Details</th>
              <th style={{ padding: '14px' }}>Category</th>
              <th style={{ padding: '14px' }}>Price Metric</th>
              <th style={{ padding: '14px' }}>Stock Capacity</th>
              <th style={{ padding: '14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No records correspond to active selection filters.</td>
              </tr>
            ) : products.map(product => {
              const isLowStock = product.stock_quantity < 5;
              return (
                <tr key={product.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isLowStock ? '#fff7ed' : 'transparent', fontSize: '15px' }}>
                  <td style={{ padding: '14px' }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    ) : (
                      <div style={{ width: '44px', height: '44px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px' }}>N/A</div>
                    )}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{product.name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{product.description || 'No custom details added.'}</div>
                  </td>
                  <td style={{ padding: '14px', color: '#334155' }}>{product.category_name}</td>
                  <td style={{ padding: '14px', fontWeight: 500 }}>₦{parseFloat(product.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', background: isLowStock ? '#ffedd5' : '#f1f5f9', color: isLowStock ? '#ea580c' : '#475569' }}>
                      {product.stock_quantity} units {isLowStock && '⚠️'}
                    </span>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenEditModal(product)} style={{ marginRight: '8px', padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                    <button onClick={() => handleDelete(product.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Global Inline Modal Management Form Container */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <form onSubmit={handleFormSubmit} style={{ background: '#fff', padding: '28px', borderRadius: '8px', maxWidth: '460px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 4px 0' }}>{editingProduct ? 'Modify Asset Variables' : 'Add New Inventory Entry'}</h3>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
              Product Title *
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
              Description
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', height: '60px', resize: 'vertical' }} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                Price (₦) *
                <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                Units in Stock *
                <input type="number" required value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
              Category Context Group *
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff' }}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
              Product Image Asset Link URL
              <input type="url" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
            </label>

            {formData.image_url && (
              <div style={{ textAlign: 'center', border: '1px dashed #cbd5e1', padding: '8px', borderRadius: '6px' }}>
                <img src={formData.image_url} alt="Resource View Preview" style={{ maxWidth: '100%', maxHeight: '90px', objectFit: 'contain' }} onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Save Product</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
