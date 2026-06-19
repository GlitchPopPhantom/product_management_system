import React, { useEffect, useState } from 'react';

// ==========================================
// CONFIGURATION & TYPES
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
  category_id: string;
  category_name?: string;
  stock_quantity: number;
  image_url: string | null;
  created_at: string;
}

interface DashboardStats {
  total_products: number;
  total_categories: number;
  inventory_value: number;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {}),
  };
};

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

  // Appearance State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Form Field States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: 0,
    category_id: '',
    image_url: ''
  });

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
        throw new Error('Could not synchronize store data with the server.');
      }

      const productsData = await prodRes.json();
      const categoriesData = await catRes.json();
      const statsData = await statRes.json();

      setProducts(productsData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (err: any) {
      setUiError(err.message || 'Error updating product rows.');
    }
  };

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
        throw new Error(data.error || 'Authentication failed. Please verify your fields.');
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

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      stock_quantity: 0, 
      category_id: categories[0]?.id || '', 
      image_url: '' 
    });
    setUiError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      category_id: product.category_id,
      image_url: product.image_url || ''
    });
    setUiError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = formData.category_id || (categories.length > 0 ? categories[0].id : '');

    if (!formData.name.trim()) return setUiError('Product Name is required.');
    if (parseFloat(formData.price) <= 0 || isNaN(parseFloat(formData.price))) return setUiError('Price must be greater than ₦0.');
    if (formData.stock_quantity < 0) return setUiError('Stock value cannot be negative.');
    if (!finalCategory) return setUiError('Please assign a valid category.');

    try {
      const url = editingProduct ? `${BASE_URL}/products/${editingProduct.id}/` : `${BASE_URL}/products/`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          stock_quantity: formData.stock_quantity,
          category_id: finalCategory,
          image_url: formData.image_url
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to complete updates on the server database.');
      }

      setIsModalOpen(false);
      loadDashboardData();
    } catch (err: any) {
      setUiError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const res = await fetch(`${BASE_URL}/products/${id}/`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok) throw new Error('Deletion process failed.');
        loadDashboardData();
      } catch (err: any) {
        setUiError(err.message);
      }
    }
  };

  const theme = {
    bg: darkMode ? '#0b0f17' : '#f4f6fa',
    surface: darkMode ? '#121824' : '#ffffff',
    border: darkMode ? '#1e293b' : '#e2e8f0',
    textMain: darkMode ? '#f8fafc' : '#0f172a',
    textMuted: darkMode ? '#94a3b8' : '#64748b',
    accent: '#38bdf8', 
    accentHover: '#7dd3fc',
    cardGlow: darkMode ? 'rgba(56, 189, 248, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    danger: '#ef4444',
    dangerBg: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
    warning: '#f97316',
    warningBg: darkMode ? 'rgba(249, 115, 22, 0.1)' : '#ffedd5',
    success: '#10b981',
    inputBg: darkMode ? '#1e293b' : '#f8fafc'
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: theme.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: theme.textMain, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)', margin: 0, padding: 0, overflowX: 'hidden' }}>
      
      {/* Global CSS Injection */}
      <style>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.97) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes backdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* The main container fixed to flow vertically downwards */
        .app-viewport { 
          width: 100%; 
          max-width: 1200px; 
          padding: 24px; 
          box-sizing: border-box; 
          display: flex; 
          flex-direction: column; 
          animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        
        .auth-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; width: 100%; padding: 24px; box-sizing: border-box; }
        .auth-card { background: ${theme.surface}; padding: 40px 32px; border-radius: 16px; border: 1px solid ${theme.border}; max-width: 420px; width: 100%; box-shadow: ${darkMode ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(148,163,184,0.15)'}; box-sizing: border-box; animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .input-focus:focus { border-color: ${theme.accent} !important; box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.15) !important; outline: none; }
        
        /* Metrics panel alignment rules */
        .metrics-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 36px;
          width: 100%;
        }

        .product-card { background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: 12px; padding: 20px; transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease; position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; width: 100%; box-sizing: border-box; }
        .product-card:hover { transform: translateY(-4px); border-color: ${theme.accent}; box-shadow: ${darkMode ? '0 16px 36px rgba(0,0,0,0.4)' : '0 16px 36px rgba(148,163,184,0.12)'}; }
        .action-btn { background: none; border: 1px solid ${theme.border}; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; }
        .action-btn.edit { color: ${theme.accent}; }
        .action-btn.edit:hover { background: ${darkMode ? 'rgba(56,189,248,0.08)' : '#f0f9ff'}; border-color: ${theme.accent}; }
        .action-btn.delete { color: ${theme.danger}; }
        .action-btn.delete:hover { background: ${theme.dangerBg}; border-color: ${theme.danger}; }
        
        /* Layout Controls Box */
        .flex-toolbar { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-bottom: 32px; box-sizing: border-box; }
        .grid-layout { display: grid; grid-template-columns: 1fr; gap: 24px; width: 100%; box-sizing: border-box; }
        
        /* Responsive Viewport Shifts */
        @media(min-width: 640px) {
          .flex-toolbar { flex-direction: row; align-items: center; }
          .search-input-field { flex: 1 !important; }
          .metrics-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media(min-width: 768px) {
          .grid-layout { grid-template-columns: repeat(2, 1fr); }
        }
        @media(min-width: 1024px) {
          .grid-layout { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* ==========================================
          GATEWAY: LOG-IN / REGISTER
          ========================================== */}
      {!token ? (
        <div className="auth-container">
          <form onSubmit={handleAuthSubmit} className="auth-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em' }}>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
              <button type="button" onClick={() => setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
            
            {authError && <div style={{ padding: '12px 16px', background: theme.dangerBg, color: theme.danger, borderRadius: '8px', marginBottom: '24px', fontSize: '14px', borderLeft: `4px solid ${theme.danger}` }}>{authError}</div>}
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 500 }}>
              Username
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="input-focus" style={{ width: '100%', padding: '12px 14px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, boxSizing: 'border-box', fontSize: '15px', transition: 'all 0.2s' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px', fontSize: '14px', fontWeight: 500 }}>
              Password
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-focus" style={{ width: '100%', padding: '12px 14px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, boxSizing: 'border-box', fontSize: '15px', transition: 'all 0.2s' }} />
            </label>

            <button type="submit" style={{ width: '100%', padding: '14px', background: theme.accent, color: '#0b0f17', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '15px', marginBottom: '24px', transition: 'background-color 0.2s' }}>
              {isRegistering ? 'Sign Up' : 'Log In'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '14px', margin: 0, color: theme.textMuted }}>
              {isRegistering ? 'Already have an account?' : 'New to our platform?'}{' '}
              <span onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }} style={{ color: theme.accent, cursor: 'pointer', fontWeight: 600 }}>
                {isRegistering ? 'Log in' : 'Create an account'}
              </span>
            </p>
          </form>
        </div>
      ) : (
        
        /* ==========================================
            MAIN CONTENT DASHBOARD
            ========================================== */
        <div className="app-viewport">
          
          {/* APP HEADER */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '24px', width: '100%' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Catalog Dashboard</h1>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '10px 16px', background: theme.surface, border: `1px solid ${theme.border}`, color: theme.textMain, cursor: 'pointer', fontSize: '14px', fontWeight: 500, borderRadius: '8px', transition: 'all 0.2s' }}>
                {darkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
              <button onClick={handleOpenCreateModal} style={{ padding: '10px 18px', background: theme.accent, color: '#0b0f17', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s' }}>
                Add Product
              </button>
              <button onClick={handleLogout} style={{ padding: '10px 16px', background: 'none', border: `1px solid ${theme.border}`, color: theme.textMuted, cursor: 'pointer', fontSize: '14px', fontWeight: 500, borderRadius: '8px', transition: 'all 0.2s' }}>
                Log Out
              </button>
            </div>
          </header>

          {uiError && <div style={{ padding: '12px 16px', background: theme.dangerBg, color: theme.danger, borderRadius: '8px', marginBottom: '28px', fontSize: '14px', borderLeft: `4px solid ${theme.danger}`, width: '100%', boxSizing: 'border-box' }}>{uiError}</div>}

          {/* OVERVIEW METRICS */}
          <section className="metrics-grid">
            <div style={{ padding: '24px', borderRadius: '14px', border: `1px solid ${theme.border}`, background: theme.surface, boxShadow: `inset 0 0 12px ${theme.cardGlow}` }}>
              <h4 style={{ margin: '0 0 8px 0', color: theme.textMuted, fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Total Products</h4>
              <p style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: theme.accent }}>{stats?.total_products || 0}</p>
            </div>
            <div style={{ padding: '24px', borderRadius: '14px', border: `1px solid ${theme.border}`, background: theme.surface, boxShadow: `inset 0 0 12px ${theme.cardGlow}` }}>
              <h4 style={{ margin: '0 0 8px 0', color: theme.textMuted, fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Categories Available</h4>
              <p style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>{stats?.total_categories || 0}</p>
            </div>
            <div style={{ padding: '24px', borderRadius: '14px', border: `1px solid ${theme.border}`, background: theme.surface, boxShadow: `inset 0 0 12px ${theme.cardGlow}` }}>
              <h4 style={{ margin: '0 0 8px 0', color: theme.textMuted, fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Estimated Net Value</h4>
              <p style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: theme.success }}>
                ₦{(stats?.inventory_value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </section>

          {/* TOOLBAR CONTROLS */}
          <div className="flex-toolbar">
            <input 
              type="text" 
              className="search-input-field input-focus"
              placeholder="Search matching items..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ width: '100%', padding: '12px 16px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, boxSizing: 'border-box', fontSize: '14px', transition: 'border-color 0.2s' }}
            />
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-focus" style={{ padding: '12px 16px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', minWidth: '180px', transition: 'border-color 0.2s' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-focus" style={{ padding: '12px 16px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', minWidth: '180px', transition: 'border-color 0.2s' }}>
              <option value="">Default Order</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
            </select>
          </div>

          {/* DYNAMIC CARD LAYOUT */}
          <div className="grid-layout">
            {products.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 24px', color: theme.textMuted, background: theme.surface, borderRadius: '14px', border: `1px solid ${theme.border}` }}>
                No items match your search parameters.
              </div>
            ) : products.map(product => {
              const isLowStock = product.stock_quantity < 5;
              return (
                <div key={product.id} className="product-card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                    
                    {/* CARD IMAGE CONTAINER */}
                    <div style={{ width: '100%', height: '200px', background: darkMode ? '#182030' : '#f8fafc', border: `1px solid ${theme.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '14px', color: theme.textMuted, fontWeight: 500 }}>No image uploaded</span>
                      )}
                      
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '30px', fontSize: '11px', fontWeight: 700, background: isLowStock ? theme.warningBg : theme.inputBg, color: isLowStock ? theme.warning : theme.textMuted, border: `1px solid ${isLowStock ? theme.warning : theme.border}`, backdropFilter: 'blur(8px)' }}>
                          {product.stock_quantity} Left
                        </span>
                      </div>
                    </div>

                    {/* DETAILS BLOCK */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: theme.textMain, lineHeight: 1.3 }}>{product.name}</h3>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: theme.accent, whiteSpace: 'nowrap' }}>
                          ₦{parseFloat(product.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <span style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                        {product.category_name || 'General Classification'}
                      </span>
                      
                      <p style={{ fontSize: '14px', color: theme.textMuted, margin: '8px 0 0 0', lineHeight: 1.5 }}>
                        {product.description || 'No overview text provided for this dynamic product.'}
                      </p>
                    </div>
                  </div>

                  {/* INTERACTIONS */}
                  <div style={{ display: 'flex', gap: '10px', borderTop: `1px solid ${theme.border}`, paddingTop: '16px', marginTop: '8px', width: '100%' }}>
                    <button onClick={() => handleOpenEditModal(product)} className="action-btn edit" style={{ flex: 1 }}>Modify Details</button>
                    <button onClick={() => handleDelete(product.id)} className="action-btn delete" style={{ flex: 1 }}>Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FORM INPUT MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(11, 15, 23, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000, backdropFilter: 'blur(8px)', animation: 'backdropFade 0.2s ease forwards' }}>
          <form onSubmit={handleFormSubmit} style={{ background: theme.surface, padding: '32px', borderRadius: '20px', border: `1px solid ${theme.border}`, maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', boxSizing: 'border-box', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {editingProduct ? 'Edit Product Details' : 'Add New Product'}
            </h3>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 600, color: theme.textMuted }}>
              Product Name *
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-focus" style={{ padding: '12px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', transition: 'all 0.2s' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 600, color: theme.textMuted }}>
              Description Overview
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-focus" style={{ padding: '12px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', height: '72px', resize: 'none', fontFamily: 'inherit', transition: 'all 0.2s' }} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 600, color: theme.textMuted }}>
                Price (₦) *
                <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="input-focus" style={{ padding: '12px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', transition: 'all 0.2s' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 600, color: theme.textMuted }}>
                Available Stock *
                <input type="number" required value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})} className="input-focus" style={{ padding: '12px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', transition: 'all 0.2s' }} />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 600, color: theme.textMuted }}>
              Category Classification *
              <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="input-focus" style={{ padding: '12px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', width: '100%', transition: 'all 0.2s' }}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 600, color: theme.textMuted }}>
              Product Image URL
              <input type="url" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="input-focus" style={{ padding: '12px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', transition: 'all 0.2s' }} />
            </label>

            {formData.image_url && (
              <div style={{ textAlign: 'center', border: `1px solid ${theme.border}`, background: theme.inputBg, padding: '12px', borderRadius: '8px' }}>
                <img src={formData.image_url} alt="Buffer Preview" style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '6px' }} onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '12px 20px', background: 'none', border: `1px solid ${theme.border}`, color: theme.textMain, cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>Cancel</button>
              <button type="submit" style={{ padding: '12px 20px', background: theme.accent, color: '#0b0f17', border: 'none', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', fontSize: '14px' }}>Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
