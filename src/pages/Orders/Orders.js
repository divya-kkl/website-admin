import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaUser, FaPhoneAlt, FaEllipsisV, FaEye, FaMotorcycle, FaEdit, FaTrash } from 'react-icons/fa';
import './Orders.css';
import OrderDetailsModal from './OrderDetailsModal';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";
const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${localStorage.getItem('jwtToken')}`
  }
});

const GET_ALL_ORDERS = gql`
  query GetAllOrders($search: String, $page: Int, $limit: Int) {
    getAllOrders(search: $search, page: $page, limit: $limit) {
      orders {
        id
        orderNumber
        subTotal
        deliveryCharge
        totalAmount
        status
        paymentStatus
        paymentMethod
        createdAt
        couponCode
        image
        items {
          productId
          name
          quantity
          price
          image
        }
        deliveryAddress {
          name
          street
          city
          state
          country
          phone
        }
        deliveryPartner {
          name
          contactNumber
        }
      }
      totalCount
    }
  }
`;

const GET_TOTAL_ORDERS_COUNT = gql`
  query GetTotalOrdersCount($search: String) {
    getTotalOrdersCount(search: $search)
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($id: ID!, $status: String!, $image: String) {
    updateOrderStatus(id: $id, status: $status, image: $image) {
      id
      status
      image
    }
  }
`;

const DELETE_ORDER = gql`
  mutation DeleteOrder($id: ID!) {
    deleteOrder(id: $id)
  }
`;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(totalCount / limit);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModalOrder, setEditModalOrder] = useState(null);
  
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [editingStatus, setEditingStatus] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [data, countData] = await Promise.all([
        client.request(GET_ALL_ORDERS, { search: searchTerm, page, limit }),
        client.request(GET_TOTAL_ORDERS_COUNT, { search: searchTerm })
      ]);
      setOrders(data.getAllOrders?.orders || []);
      setFilteredOrders(data.getAllOrders?.orders || []);
      setTotalCount(countData.getTotalOrdersCount || 0);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page]);

  if (error) return <div className="orders-error">Error loading orders: {error.message}</div>;

  const handleStatusChange = async (id, newStatus, imageStr) => {
    try {
      await client.request(UPDATE_ORDER_STATUS, { id, status: newStatus, image: imageStr });
      fetchOrders();
      setEditModalOrder(null);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
    setOpenDropdownId(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "image_e-commerce");

    setUploadingImage(true);
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dvhtqze0j/image/upload", {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      setEditingImage(fileData.secure_url);
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await client.request(DELETE_ORDER, { id });
        fetchOrders();
      } catch (err) {
        alert("Failed to delete order: " + err.message);
      }
    }
    setOpenDropdownId(null);
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const openEditModal = (order) => {
    setEditModalOrder(order);
    setOpenDropdownId(null);
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-pending';
    switch (status.toUpperCase()) {
      case 'DELIVERED': return 'status-delivered';
      case 'SHIPPED': return 'status-shipped';
      case 'CANCELLED': return 'status-cancelled';
      case 'PENDING': return 'status-pending';
      default: return 'status-pending';
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    const parts = [addr.street, addr.city, addr.state, addr.country].filter(Boolean);
    
    if (parts.length === 0) {
      return (
        <div style={{ color: '#111' }}>
          {addr.phone ? `Contact: ${addr.phone}` : "N/A"}
        </div>
      );
    }

    const line1Parts = parts.slice(0, Math.max(1, parts.length - 1));
    const lastPart = parts.length > 1 ? parts[parts.length - 1] : "";
    
    const line1 = line1Parts.join(", ");
    
    let line2 = "";
    if (lastPart && addr.phone) line2 = `${lastPart} | Contact: ${addr.phone}`;
    else if (lastPart) line2 = lastPart;
    else if (addr.phone) line2 = `Contact: ${addr.phone}`;

    return (
      <div style={{ lineHeight: '1.6', color: '#111' }}>
        {line1}{line1 && line2 ? "," : ""}
        {(line1 && line2) && <br />}
        {line2}
      </div>
    );
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    let date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
    }
    return (
      <div style={{ lineHeight: '1.5' }}>
        {date.toLocaleDateString('en-IN')},<br />
        {date.toLocaleTimeString('en-IN').toLowerCase()}
      </div>
    );
  };

  return (
    <div className="orders-page">
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
      <div className="orders-card">
        <div className="orders-header">
          <h2>Orders</h2>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search orders..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Ordernumber</th>
                <th>Ordername</th>
                <th>Coupon<br/>Code</th>
                <th>Address</th>
                <th>Total<br/>Amount</th>
                <th>Total<br/>items</th>
                <th>Status</th>
                <th>Delivery<br/>Partner</th>
                <th>Order created<br/>time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    {Array.from({ length: 11 }).map((_, cIdx) => (
                      <td key={cIdx} style={{ padding: '15px' }}>
                        <div className="shimmer-box" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredOrders.map((order, index) => (
                <tr key={order.id}>
                  <td>{index + 1}</td>
                  <td>{order.orderNumber}</td>
                  <td>{order.items?.[0]?.name || "N/A"}</td>
                  <td>{order.couponCode || "N/A"}</td>
                  <td className="address-cell">{formatAddress(order.deliveryAddress)}</td>
                  <td>{order.totalAmount}</td>
                  <td>{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    {order.deliveryPartner ? (
                      <div className="delivery-partner">
                        <div className="dp-row">
                          <FaUser className="dp-icon-user" /> {order.deliveryPartner.name}
                        </div>
                        <div className="dp-row">
                          <FaPhoneAlt className="dp-icon-phone" /> {order.deliveryPartner.contactNumber}
                        </div>
                      </div>
                    ) : (
                      <span className="not-assigned">Not Assigned</span>
                    )}
                  </td>
                  <td>{formatDateTime(order.createdAt)}</td>
                  <td className="relative-cell">
                    <button 
                      className="action-btn"
                      onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                    >
                      <FaEllipsisV />
                    </button>
                    {openDropdownId === order.id && (
                      <div className="dropdown-menu">
                        <button className="dropdown-item" onClick={() => openDetails(order)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaEye style={{ color: '#3b82f6', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>View Order</span>
                        </button>
                        <button className="dropdown-item" onClick={() => alert('Delivery Access not implemented yet')} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaMotorcycle style={{ color: '#3b82f6', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Delivery Access</span>
                        </button>
                        <button className="dropdown-item" onClick={() => openEditModal(order)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaEdit style={{ color: '#f59e0b', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Edit Order</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleDelete(order.id)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaTrash style={{ color: '#ef4444', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Delete Order</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#858796' }}>No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '5px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                background: page === p ? '#007bff' : '#fff',
                color: page === p ? '#fff' : '#333',
                cursor: 'pointer',
                fontWeight: page === p ? 'bold' : 'normal'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {isModalOpen && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

      {editModalOrder && (
        <div className="modal-overlay" onClick={() => setEditModalOrder(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '8px', padding: '30px', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#000', fontFamily: "'Times New Roman', Times, serif" }}>
              Update Order Status
            </h3>
            <div>
              <select 
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '20px', fontFamily: "sans-serif" }}
                value={editModalOrder.status || 'PENDING'}
                onChange={(e) => {
                  setEditModalOrder({...editModalOrder, status: e.target.value});
                }}
              >
                <option value="PENDING">PENDING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button 
                  onClick={() => {
                    handleStatusChange(editModalOrder.id, editModalOrder.status, editingImage);
                    setEditModalOrder(null);
                  }}
                  disabled={uploadingImage}
                  style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: uploadingImage ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px', fontFamily: "sans-serif" }}
                >
                  Update Status
                </button>
                <button 
                  onClick={() => setEditModalOrder(null)} 
                  style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', fontFamily: "sans-serif" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
