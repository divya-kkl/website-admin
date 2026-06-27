import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaEye, FaImage, FaSearch } from 'react-icons/fa';
import './Cart.css';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";
const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${localStorage.getItem('jwtToken')}`
  }
});

const GET_ALL_CARTS = gql`
  query GetAllCarts {
    getAllCarts {
      id
      userId
      shopId
      products {
        productId
        productName
        productImage
        quantity
        price
        mrp
        totalPrice
      }
      totalQuantity
      subTotal
      status
      createdAt
      updatedAt
    }
  }
`;

function Cart() {
  const [carts, setCarts] = useState([]);
  const [filteredCarts, setFilteredCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [viewModalCart, setViewModalCart] = useState(null);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const data = await client.request(GET_ALL_CARTS);
      setCarts(data.getAllCarts || []);
      setFilteredCarts(data.getAllCarts || []);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCarts();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = carts.filter(cart => 
        cart.userId?.toLowerCase().includes(lowercasedSearch) ||
        cart.status?.toLowerCase().includes(lowercasedSearch) ||
        cart.id?.toLowerCase().includes(lowercasedSearch)
      );
      setFilteredCarts(filtered);
    } else {
      setFilteredCarts(carts);
    }
  }, [searchTerm, carts]);

  const openViewDetails = (cart) => {
    setViewModalCart(cart);
  };

  const closeViewDetails = () => {
    setViewModalCart(null);
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-inactive';
    return status.toUpperCase() === 'ACTIVE' ? 'status-active' : 'status-inactive';
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    let date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) return "N/A";
    }
    return `${date.toLocaleDateString('en-IN')}, ${date.toLocaleTimeString('en-IN').toLowerCase()}`;
  };

  if (error) return <div className="cart-error">Error loading carts: {error.message}</div>;

  return (
    <div className="cart-page">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -468px 0; }
          100% { background-position: 468px 0; }
        }
        .shimmer-box {
          height: 20px;
          background: #f6f7f8;
          background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
          background-size: 800px 100%;
          animation: shimmer 1.5s infinite linear forwards;
          border-radius: 4px;
        }
      `}</style>
      <div className="cart-card">
        <div className="cart-header">
          <h2>User Carts</h2>
          <div className="header-actions">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search by User ID or Status..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="cart-table-wrapper">
          <table className="cart-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Cart ID</th>
                <th>User ID</th>
                <th>Total Items</th>
                <th>Sub Total</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    {Array.from({ length: 8 }).map((_, cIdx) => (
                      <td key={cIdx} style={{ padding: '15px' }}>
                        <div className="shimmer-box" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredCarts.map((cart, index) => (
                <tr key={cart.id}>
                  <td>{index + 1}</td>
                  <td className="id-cell">{cart.id}</td>
                  <td className="id-cell">{cart.userId}</td>
                  <td style={{ fontWeight: '600', color: '#4e73df' }}>{cart.totalQuantity}</td>
                  <td style={{ color: '#28a745', fontWeight: 'bold' }}>₹{cart.subTotal}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(cart.status)}`}>
                      {cart.status || 'INACTIVE'}
                    </span>
                  </td>
                  <td>{formatDateTime(cart.updatedAt || cart.createdAt)}</td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => openViewDetails(cart)}
                      title="View Cart Details"
                    >
                      <FaEye /> View
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredCarts.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-table-msg">No carts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {viewModalCart && (
        <div className="modal-overlay" onClick={closeViewDetails} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '700px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEye color="#4a90e2" /> Cart Details
              </h2>
              <button onClick={closeViewDetails} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '15px', color: '#555' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Cart ID:</strong> <span>{viewModalCart.id}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>User ID:</strong> <span>{viewModalCart.userId}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Status:</strong> <span><span className={`status-badge ${getStatusClass(viewModalCart.status)}`}>{viewModalCart.status}</span></span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Last Updated:</strong> <span>{formatDateTime(viewModalCart.updatedAt)}</span></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', marginTop: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Items</span>
                  <span style={{ fontSize: '24px', color: '#4a90e2', fontWeight: 'bold' }}>{viewModalCart.totalQuantity}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6c757d', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sub Total</span>
                  <span style={{ fontSize: '24px', color: '#28a745', fontWeight: 'bold' }}>₹{viewModalCart.subTotal}</span>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block', alignSelf: 'flex-start' }}>Products in Cart</h3>
              
              {viewModalCart.products && viewModalCart.products.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {viewModalCart.products.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', background: '#fff' }}>
                      <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <FaImage size={30} color="#ccc" />
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333' }}>{item.productName}</h4>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>ID: {item.productId}</div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: '#28a745' }}>₹{item.price}</span>
                          <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '13px' }}>₹{item.mrp}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '8px' }}>
                        <div style={{ background: '#eef2f7', color: '#4a5568', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>Qty: {item.quantity}</div>
                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px' }}>₹{item.totalPrice}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#888', background: '#f9f9f9', borderRadius: '8px', border: '1px dashed #ddd' }}>This cart is empty.</div>
              )}
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <button onClick={closeViewDetails} style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }} onMouseOver={(e) => e.currentTarget.style.background = '#357abd'} onMouseOut={(e) => e.currentTarget.style.background = '#4a90e2'}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
