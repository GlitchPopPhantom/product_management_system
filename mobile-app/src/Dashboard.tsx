import React, { useState, useEffect } from 'react';
import { api, Product, Category, DashboardStats } from './api';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
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
      console.error(err);
      setError(err.message || 'An error occurred while communicating with Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [search, selectedCategory, sortBy]);

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#fff', minHeight: '100vh', padding: '2rem', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Catalog Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ backgroundColor: '#1f293d', color: '#fff', border: '1px solid #374151', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}>☀️ Light</button>
          <button style={{ backgroundColor: '#0ea5e9', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontWeight: 'bold', cursor: 'pointer' }}>Add Product</button>
          <button style={{ backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #374151', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer' }}>Log Out</button>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#2d1215', borderLeft: '4px solid #f43f5e', color: '#f43f5e', padding: '1rem', borderRadius: '0.375rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <p style={{ color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Total Products</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#0ea5e9' }}>{loading ? '...' : stats?.totalProducts || 0}</p>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <p style={{ color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Categories Available</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{loading ? '...' : stats?.categoriesAvailable || 0}</p>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', padding: '1.5rem', borderRadius: '0.5rem' }}>
          <p style={{ color: '#9ca3af', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Estimated Net Value</p>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
            ₦{loading ? '...' : stats?.estimatedNetValue.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Search matching items..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, backgroundColor: '#111827', border: '1px solid #1f2937', color: '#fff', padding: '0.75rem 1rem', borderRadius: '0.375rem', outline: 'none' }}
        />
        
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ backgroundColor: '#111827', border: '1px solid #1f2937', color: '#fff', padding: '0.75rem 1rem', borderRadius: '0.375rem', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.Category_id} value={cat.Category_id.toString()}>
              {cat.Category_Name}
            </option>
          ))}
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          style={{ backgroundColor: '#111827', border: '1px solid #1f2937', color: '#fff', padding: '0.75rem 1rem', borderRadius: '0.375rem', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">Default Order</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Product Name: A-Z</option>
        </select>
      </div>

      <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '0.5rem', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {loading ? (
          <p style={{ color: '#9ca3af' }}>Syncing database states...</p>
        ) : products.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No items match your search parameters.</p>
        ) : (
          <div style={{ width: '100%', padding: '1rem', boxSizing: 'border-box' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937', color: '#9ca3af' }}>
                  <th style={{ padding: '0.75rem' }}>Id</th>
                  <th style={{ padding: '0.75rem' }}>Product Name</th>
                  <th style={{ padding: '0.75rem' }}>Price</th>
                  <th style={{ padding: '0.75rem' }}>Stock Quantity</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #1f2937' }}> {/* CHANGED TO LOWERCASE */}
                    <td style={{ padding: '0.75rem' }}>{product.id}</td> {/* CHANGED TO LOWERCASE */}
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{product["Product Name"]}</td>
                    <td style={{ padding: '0.75rem', color: '#10b981' }}>₦{product.Price.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>{product["Stock Quantity"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
