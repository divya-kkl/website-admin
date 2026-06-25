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
        <div className="modal-overlay" onClick={closeViewDetails}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cart Details</h2>
              <button className="btn-close" onClick={closeViewDetails}>&times;</button>
            </div>
            
            <div className="modal-body scrollable-body">
              <div className="view-info-grid">
                <div><strong>Cart ID:</strong> <span className="id-text">{viewModalCart.id}</span></div>
                <div><strong>User ID:</strong> <span className="id-text">{viewModalCart.userId}</span></div>
                <div><strong>Status:</strong> <span className={`status-badge ${getStatusClass(viewModalCart.status)}`}>{viewModalCart.status}</span></div>
                <div><strong>Last Updated:</strong> {formatDateTime(viewModalCart.updatedAt)}</div>
              </div>

              <div className="view-totals">
                <div className="total-box">
                  <span className="total-label">Total Items</span>
                  <span className="total-value text-blue">{viewModalCart.totalQuantity}</span>
                </div>
                <div className="total-box">
                  <span className="total-label">Sub Total</span>
                  <span className="total-value text-green">₹{viewModalCart.subTotal}</span>
                </div>
              </div>

              <div className="view-section-title">Products in Cart</div>
              
              {viewModalCart.products && viewModalCart.products.length > 0 ? (
                <div className="cart-products-list">
                  {viewModalCart.products.map((item, idx) => (
                    <div key={idx} className="cart-product-card">
                      <div className="cart-product-img">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} />
                        ) : (
                          <div className="img-placeholder"><FaImage /></div>
                        )}
                      </div>
                      <div className="cart-product-details">
                        <h4 className="product-name">{item.productName}</h4>
                        <div className="product-id">ID: {item.productId}</div>
                        <div className="product-price-row">
                          <span className="price">₹{item.price}</span>
                          <span className="mrp">₹{item.mrp}</span>
                        </div>
                      </div>
                      <div className="cart-product-totals">
                        <div className="qty-badge">Qty: {item.quantity}</div>
                        <div className="item-total">₹{item.totalPrice}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-products-msg">This cart is empty.</div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeViewDetails}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
