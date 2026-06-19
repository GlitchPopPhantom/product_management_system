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
  category_id: string; // Enforcing exact spec schema field
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

  // System Theme Mode (Dark Mode Default)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // Form Field States - Explicitly matching the exact database column spec
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: 0,
    category_id: '',
    image_url: ''
  });

  // Save theme selection changes
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
        throw new Error('Backend synchronization is failing.');
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
    if (parseFloat(formData.price) <= 0 || isNaN(parseFloat(formData.price))) return setUiError('Price must be greater than 0.');
    if (formData.stock_quantity < 0) return setUiError('Stock cannot be negative.');
    if (!finalCategory) return setUiError('Category field validation required.');

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
        throw new Error(errorData.error || 'Failed to preserve modifications to database rows.');
      }

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

  // Theme Style Color Mappings
  const theme = {
    bg: darkMode ? '#0c0f12' : '#f8fafc',
    surface: darkMode ? '#13171c' : '#ffffff',
    border: darkMode ? '#262d35' : '#e2e8f0',
    textMain: darkMode ? '#f1f5f9' : '#0f172a',
    textMuted: darkMode ? '#8295a5' : '#64748b',
    accent: '#00e5ff',
    accentHover: '#00bccc',
    danger: '#ff5252',
    dangerBg: darkMode ? 'rgba(255,82,82,0.1)' : '#fee2e2',
    warning: '#ff9100',
    warningBg: darkMode ? 'rgba(255,145,0,0.1)' : '#fff7ed',
    success: '#00e676',
    inputBg: darkMode ? '#1a2026' : '#ffffff'
  };

  // ==========================================
  // AUTHENTICATION INTERFACE (GATEWAY)
  // ==========================================
  if (!token) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: theme.bg, fontFamily: 'monospace', color: theme.textMain, padding: '16px', boxSizing: 'border-box' }}>
        <form onSubmit={handleAuthSubmit} style={{ background: theme.surface, padding: '32px', borderRadius: '4px', border: `1px solid ${theme.border}`, maxWidth: '400px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', letterSpacing: '1px', textTransform: 'uppercase', color: theme.accent }}>// SYS_AUTH</h2>
            <button type="button" onClick={() => setDarkMode(!darkMode)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: '14px' }}>
              {darkMode ? '[LIGHT_MODE]' : '[DARK_MODE]'}
            </button>
          </div>
          
          {authError && <div style={{ padding: '12px', background: theme.dangerBg, color: theme.danger, borderLeft: `3px solid ${theme.danger}`, marginBottom: '20px', fontSize: '13px' }}>Error: {authError}</div>}
          
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '13px', color: theme.textMuted }}>
            IDENTIFIER_USR
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace', boxSizing: 'border-box' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px', fontSize: '13px', color: theme.textMuted }}>
            ACCESS_KEY_PWD
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace', boxSizing: 'border-box' }} />
          </label>

          <button type="submit" style={{ width: '100%', padding: '12px', background: theme.accent, color: '#0c0f12', border: 'none', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '14px', marginBottom: '20px' }}>
            {isRegistering ? 'Execute Registration' : 'Initialize Session'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', margin: 0, color: theme.textMuted }}>
            {isRegistering ? 'Existing Account identified?' : "Require new profile access?"}{' '}
            <span onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }} style={{ color: theme.accent, cursor: 'pointer', textDecoration: 'underline' }}>
              {isRegistering ? 'Login' : 'Register'}
            </span>
          </p>
        </form>
      </div>
    );
  }

  // ==========================================
  // CORE MANAGEMENT SYSTEM LAYOUT (40/60 Split-Feel Grid)
  // ==========================================
  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: 'monospace', color: theme.textMain, padding: '24px', boxSizing: 'border-box', transition: 'background 0.2s ease' }}>
      
      {/* SYSTEM HEADER BAR */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
            INV_CORE // <span style={{ color: theme.textMuted, fontWeight: 'normal', fontSize: '14px' }}>PRODUCT_MGMT_SYS</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '8px 12px', background: 'none', border: `1px solid ${theme.border}`, color: theme.textMuted, cursor: 'pointer', fontSize: '12px', borderRadius: '2px' }}>
            {darkMode ? 'MODE: DARK' : 'MODE: LIGHT'}
          </button>
          <button onClick={handleOpenCreateModal} style={{ padding: '8px 16px', background: theme.accent, color: '#0c0f12', border: 'none', borderRadius: '2px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
            + NEW_PRODUCT
          </button>
          <button onClick={handleLogout} style={{ padding: '8px 12px', background: 'none', border: `1px solid ${theme.border}`, color: theme.danger, cursor: 'pointer', fontSize: '12px', borderRadius: '2px' }}>
            LOGOUT
          </button>
        </div>
      </header>

      {uiError && <div style={{ padding: '12px', background: theme.dangerBg, color: theme.danger, borderLeft: `4px solid ${theme.danger}`, marginBottom: '20px', fontSize: '13px' }}>[SYS_ERR]: {uiError}</div>}

      {/* OVERVIEW STATS ROW */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', border: `1px solid ${theme.border}`, borderRadius: '2px', background: theme.surface }}>
          <h4 style={{ margin: '0 0 12px 0', color: theme.textMuted, fontSize: '11px', letterSpacing: '1px' }}>METRIC_TOTAL_ITEMS</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: theme.accent }}>{stats?.total_products || 0}</p>
        </div>
        <div style={{ padding: '16px', border: `1px solid ${theme.border}`, borderRadius: '2px', background: theme.surface }}>
          <h4 style={{ margin: '0 0 12px 0', color: theme.textMuted, fontSize: '11px', letterSpacing: '1px' }}>METRIC_CATEGORIES_ACTIVE</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{stats?.total_categories || 0}</p>
        </div>
        <div style={{ padding: '16px', border: `1px solid ${theme.border}`, borderRadius: '2px', background: theme.surface }}>
          <h4 style={{ margin: '0 0 12px 0', color: theme.textMuted, fontSize: '11px', letterSpacing: '1px' }}>METRIC_AGGREGATE_VALUE</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: theme.success }}>
            ₦{(stats?.inventory_value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </section>

      {/* MAIN WORKSPACE split framework */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* FILTERS AND TOOLS BAR */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '16px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '2px' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
            <input 
              type="text" 
              placeholder="Query structural string match..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ width: '100%', padding: '10px 12px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace', boxSizing: 'border-box' }}
            />
          </div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace' }}>
            <option value="">Filter: All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace' }}>
            <option value="">Sort: System Baseline</option>
            <option value="price">Price: Ascending</option>
            <option value="-price">Price: Descending</option>
          </select>
        </div>

        {/* PRIMARY DATA GRID DISPLAY */}
        <div style={{ overflowX: 'auto', border: `1px solid ${theme.border}`, borderRadius: '2px', background: theme.surface }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: darkMode ? '#181e24' : '#f1f5f9', borderBottom: `1px solid ${theme.border}`, color: theme.textMuted }}>
                <th style={{ padding: '12px 16px', width: '60px' }}>IMG_PREV</th>
                <th style={{ padding: '12px 16px' }}>DESCRIPTOR_DATA</th>
                <th style={{ padding: '12px 16px', width: '180px' }}>SYS_CATEGORY</th>
                <th style={{ padding: '12px 16px', width: '150px' }}>UNIT_PRICE</th>
                <th style={{ padding: '12px 16px', width: '160px' }}>STOCK_QUANTITY</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', width: '160px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>// No database rows matched current lookup structure.</td>
                </tr>
              ) : products.map(product => {
                const isLowStock = product.stock_quantity < 5;
                return (
                  <tr key={product.id} style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: isLowStock ? theme.warningBg : 'transparent', transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '2px', border: `1px solid ${theme.border}` }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', background: theme.inputBg, border: `1px dashed ${theme.border}`, borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: '9px' }}>NULL</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 'bold', color: theme.textMain }}>{product.name}</div>
                      <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>{product.description || 'No system descriptor field supplied.'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: theme.textMain }}>
                      <code style={{ background: theme.inputBg, padding: '2px 6px', borderRadius: '2px', border: `1px solid ${theme.border}` }}>
                        {product.category_name || `ID: ${product.category_id}`}
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>₦{parseFloat(product.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '2px', fontSize: '11px', fontWeight: 'bold', background: isLowStock ? theme.warningBg : theme.inputBg, border: `1px solid ${isLowStock ? theme.warning : theme.border}`, color: isLowStock ? theme.warning : theme.textMain }}>
                        {product.stock_quantity} {isLowStock && '[CRIT_LOW]'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => handleOpenEditModal(product)} style={{ marginRight: '8px', padding: '4px 10px', background: 'none', border: `1px solid ${theme.border}`, color: theme.accent, cursor: 'pointer', borderRadius: '2px', fontSize: '12px' }}>EDIT</button>
                      <button onClick={() => handleDelete(product.id)} style={{ padding: '4px 10px', background: 'none', border: `1px solid ${theme.border}`, color: theme.danger, cursor: 'pointer', borderRadius: '2px', fontSize: '12px' }}>DROP</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* OVERLAY SYSTEM MODAL (DATA PERSISTENCE VIEW) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(6, 9, 12, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <form onSubmit={handleFormSubmit} style={{ background: theme.surface, padding: '24px', border: `1px solid ${theme.border}`, maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', color: theme.accent }}>
              {editingProduct ? '// UPDATE_TARGET_RECORD' : '// INJECT_NEW_RECORD'}
            </h3>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme.textMuted }}>
              PRODUCT NAME *
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: '8px 10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme.textMuted }}>
              DESCRIPTOR FIELD
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ padding: '8px 10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace', height: '54px', resize: 'none' }} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme.textMuted }}>
                UNIT PRICE (NGN) *
                <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={{ padding: '8px 10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme.textMuted }}>
                STOCK QUANTITY *
                <input type="number" required value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})} style={{ padding: '8px 10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace' }} />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme.textMuted }}>
              CATEGORY MATRIX SPEC *
              <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} style={{ padding: '8px 10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace' }}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: theme.textMuted }}>
              IMAGE_URL_STRING
              <input type="url" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} style={{ padding: '8px 10px', background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: '2px', color: theme.textMain, fontFamily: 'monospace' }} />
            </label>

            {formData.image_url && (
              <div style={{ textAlign: 'center', border: `1px dashed ${theme.border}`, background: theme.inputBg, padding: '8px', borderRadius: '2px' }}>
                <img src={formData.image_url} alt="Buffer Preview" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: 'none', border: `1px solid ${theme.border}`, color: theme.textMuted, cursor: 'pointer', borderRadius: '2px' }}>ABORT</button>
              <button type="submit" style={{ padding: '8px 16px', background: theme.accent, color: '#0c0f12', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '2px' }}>COMMIT_CHANGES</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
