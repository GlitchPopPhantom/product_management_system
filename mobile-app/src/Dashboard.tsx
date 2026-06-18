import React, { useEffect, useState } from 'react';
import { api } from './api';
import { Product, Category, DashboardStats } from './types';

export const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Pipeline management hooks
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Field States with Assessment Validation Bounds
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: 0,
    category: '',
    image_url: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, [search, selectedCategory, sortBy]);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [productsData, categoriesData, statsData] = await Promise.all([
        api.getProducts(search, selectedCategory, sortBy),
        api.getCategories(),
        api.getStats()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message || 'An operational error occurred pulling backend resources.');
    }
  };

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
    
    // Enforcing strict assessment requirement validations
    if (!formData.name.trim()) return setError('Product Name is required.');
    if (parseFloat(formData.price) <= 0 || isNaN(parseFloat(formData.price))) return setError('Price must be greater than 0.');
    if (formData.stock_quantity < 0) return setError('Stock cannot be negative.');
    if (!formData.category) return setError('Category selection is required.');

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setIsModalOpen(false);
      loadDashboardData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you certain you want to remove this product entry?')) {
      try {
        await api.deleteProduct(id);
        loadDashboardData();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Product Management Dashboard</h2>
        <button onClick={handleOpenCreateModal} style={{ padding: '10px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          + Create Product
        </button>
      </header>

      {error && <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}

      {/* KPI Dashboard Card Grid Layout */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>Total Products</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{stats?.total_products || 0}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>Total Categories</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{stats?.total_categories || 0}</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#4a5568' }}>Inventory Value</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
            ₦{(stats?.inventory_value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </section>

      {/* Search and Filters Layout toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="Search by Product Name..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{ padding: '8px 12px', width: '260px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
        />
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
          <option value="">Sort By</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
        </select>
      </div>

      {/* Main Inventory Products Data Table Layout */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#fff' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px' }}>Image</th>
              <th style={{ padding: '12px' }}>Product Name</th>
              <th style={{ padding: '12px' }}>Category</th>
              <th style={{ padding: '12px' }}>Price</th>
              <th style={{ padding: '12px' }}>Stock Quantity</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Empty search results or no available products.</td>
              </tr>
            ) : products.map(product => {
              const isLowStock = product.stock_quantity < 5; // Bonus Requirement A
              return (
                <tr key={product.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isLowStock ? '#fff7ed' : 'transparent' }}>
                  <td style={{ padding: '12px' }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', background: '#e2e8f0', borderRadius: '4px' }} />
                    )}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 500 }}>{product.name}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>{product.category_name}</td>
                  <td style={{ padding: '12px' }}>₦{parseFloat(product.price).toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', background: isLowStock ? '#ffedd5' : '#e2e8f0', color: isLowStock ? '#c2410c' : '#334155' }}>
                      {product.stock_quantity} {isLowStock && '(Low Stock)'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => handleOpenEditModal(product)} style={{ marginRight: '8px', padding: '6px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(product.id)} style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal Form Layout Component */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 1000 }}>
          <form onSubmit={handleFormSubmit} style={{ background: '#fff', padding: '24px', borderRadius: '8px', maxWidth: '450px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>{editingProduct ? 'Edit Product Parameters' : 'Create New Inventory Product'}</h3>
            
            <label>Product Name *
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </label>

            <label>Description
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>Price (₦) *
                <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </label>
              <label>Stock Quantity *
                <input type="number" required value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </label>
            </div>

            <label>Category *
              <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label>Product Image URL
              <input type="url" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </label>

            {/* Bonus C: Live Product Image Preview Before Saving */}
            {formData.image_url && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Image Preview:</p>
                <img src={formData.image_url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e2e8f0' }} onError={(e)=>{(e.target as HTMLElement).style.display='none'}} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', background: '#cbd5e1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 16px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
