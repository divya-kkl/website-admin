import React from 'react';
import { FaTimes, FaPhoneAlt, FaUser, FaTruck } from 'react-icons/fa';
import './OrderDetailsModal.css';

function OrderDetailsModal({ order, onClose }) {
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    let date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) return "N/A";
    }
    return `${date.toLocaleDateString('en-IN')}, ${date.toLocaleTimeString('en-IN').toLowerCase()}`;
  };

  const getStatusClass = (status) => {
    if (!status) return 'od-status-pending';
    switch (status.toUpperCase()) {
      case 'DELIVERED': return 'od-status-delivered';
      case 'SHIPPED': return 'od-status-shipped';
      case 'CANCELLED': return 'od-status-cancelled';
      case 'PENDING': return 'od-status-pending';
      default: return 'od-status-pending';
    }
  };

  return (
    <div className="od-modal-overlay" onClick={onClose}>
      <div className="od-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="od-modal-header">
          <h2>Order Details</h2>
          <button className="od-close-icon" onClick={onClose}><FaTimes /></button>
        </div>
        
        <div className="od-modal-body">
          <div className="od-order-info-row">
            <div>
              <h3 className="od-order-number">Order #{order.orderNumber}</h3>
              <p className="od-order-date">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <span className={`od-status-badge ${getStatusClass(order.status)}`}>
                {order.status?.toUpperCase() || 'PENDING'}
              </span>
            </div>
          </div>

          <div className="od-section">
            <h4 className="od-section-title">ITEMS</h4>
            <div className="od-items-container">
              {order.items?.map((item, idx) => (
                <div className="od-item-card" key={idx}>
                  <img src={item.image || 'https://via.placeholder.com/60'} alt={item.name} className="od-item-img" />
                  <div className="od-item-details">
                    <div className="od-item-name">{item.name}</div>
                    <div className="od-item-qty">Qty: {item.quantity} x ₹{item.price}</div>
                  </div>
                  <div className="od-item-total">₹{item.quantity * item.price}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="od-two-col">
            <div className="od-col">
              <div className="od-section">
                <h4 className="od-section-title">DELIVERY ADDRESS</h4>
                <div className="od-card">
                  <p className="od-address-text">
                    {[order.deliveryAddress?.street, order.deliveryAddress?.city, order.deliveryAddress?.state, order.deliveryAddress?.country].filter(Boolean).join(", ")}
                  </p>
                  {order.deliveryAddress?.phone && (
                    <div className="od-phone-link">
                      <FaPhoneAlt style={{ color: '#3b82f6', fontSize: '13px' }} /> {order.deliveryAddress.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="od-section">
                <h4 className="od-section-title">DELIVERY PARTNER</h4>
                {order.deliveryPartner ? (
                  <div className="od-card od-partner-card">
                    <div className="od-partner-name"><FaUser style={{ color: '#3b82f6' }} /> {order.deliveryPartner.name}</div>
                    <div className="od-partner-details">
                      <span className="od-partner-icon-text"><FaPhoneAlt /> {order.deliveryPartner.contactNumber}</span>
                      {order.deliveryPartner.vehicleNumber && (
                        <span className="od-partner-icon-text"><FaTruck /> {order.deliveryPartner.vehicleNumber}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="od-card" style={{ color: '#666' }}>Not Assigned</div>
                )}
              </div>
            </div>

            <div className="od-col">
              <div className="od-section">
                <h4 className="od-section-title">PAYMENT DETAILS</h4>
                <div className="od-card">
                  <div className="od-payment-row">
                    <span>Subtotal</span>
                    <span>₹{order.subTotal}</span>
                  </div>
                  <div className="od-payment-row">
                    <span>Delivery Charge</span>
                    <span>₹{order.deliveryCharge}</span>
                  </div>
                  <hr className="od-divider" />
                  <div className="od-payment-row od-total-row">
                    <span>Total Amount</span>
                    <span>₹{order.totalAmount}</span>
                  </div>
                  <div className="od-payment-method">
                    Method: <strong>{order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="od-modal-footer">
          <button className="od-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
