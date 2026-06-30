import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaEdit, FaTrash, FaPlus, FaTruck } from 'react-icons/fa';
import './DeliveryCharger.css';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";
const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${localStorage.getItem('jwtToken')}`
  }
});

const GET_ALL_DELIVERY_CHARGERS = gql`
  query GetAllDeliveryChargers {
    getAllDeliveryChargers {
      id
      charge
      status
      createdTime
    }
  }
`;

const CREATE_DELIVERY_CHARGER = gql`
  mutation CreateDeliveryCharger($input: CreateDeliveryChargerInput!) {
    createDeliveryCharger(input: $input) {
      id
    }
  }
`;

const UPDATE_DELIVERY_CHARGER = gql`
  mutation UpdateDeliveryCharger($id: ID!, $input: UpdateDeliveryChargerInput!) {
    updateDeliveryCharger(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE_DELIVERY_CHARGER = gql`
  mutation DeleteDeliveryCharger($id: ID!) {
    deleteDeliveryCharger(id: $id)
  }
`;

function DeliveryCharger() {
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharger, setEditingCharger] = useState(null);
  
  const [formData, setFormData] = useState({
    charge: '',
    status: 'ACTIVE'
  });

  const fetchChargers = async () => {
    setLoading(true);
    try {
      const data = await client.request(GET_ALL_DELIVERY_CHARGERS);
      setChargers(data.getAllDeliveryChargers || []);
    } catch (err) {
      console.error("Error fetching delivery chargers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChargers();
  }, []);

  const handleOpenModal = (charger = null) => {
    if (charger) {
      setEditingCharger(charger);
      setFormData({
        charge: charger.charge.toString(),
        status: charger.status
      });
    } else {
      setEditingCharger(null);
      setFormData({
        charge: '',
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCharger(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked ? 'ACTIVE' : 'INACTIVE'
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const chargeValue = parseFloat(formData.charge);
      if (isNaN(chargeValue)) {
        alert("Please enter a valid number for charge.");
        return;
      }

      if (editingCharger) {
        await client.request(UPDATE_DELIVERY_CHARGER, {
          id: editingCharger.id,
          input: {
            charge: chargeValue,
            status: formData.status
          }
        });
      } else {
        await client.request(CREATE_DELIVERY_CHARGER, {
          input: {
            charge: chargeValue,
            status: formData.status
          }
        });
      }
      handleCloseModal();
      fetchChargers();
    } catch (err) {
      console.error("Error saving delivery charger:", err);
      alert("Failed to save delivery charger. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this delivery charger?")) {
      try {
        await client.request(DELETE_DELIVERY_CHARGER, { id });
        fetchChargers();
      } catch (err) {
        console.error("Error deleting delivery charger:", err);
        alert("Failed to delete delivery charger.");
      }
    }
  };

  if (loading && chargers.length === 0) return <div>Loading delivery chargers...</div>;

  return (
    <div className="delivery-charger-admin-container">
      <div className="delivery-charger-admin-header">
        <h2>Delivery Charges</h2>
        <button className="add-btn" onClick={() => handleOpenModal()}>
          <FaPlus /> Add New Charge
        </button>
      </div>

      <table className="delivery-charger-table">
        <thead>
          <tr>
            <th>Charge Amount</th>
            <th>Status</th>
            <th>Created Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {chargers.map((charger) => (
            <tr key={charger.id}>
              <td style={{ fontWeight: '500', color: '#2c3e50' }}>₹{charger.charge.toFixed(2)}</td>
              <td>
                <span className={`status-badge ${charger.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                  {charger.status}
                </span>
              </td>
              <td style={{ color: '#7f8c8d', fontSize: '0.9em' }}>
                {charger.createdTime ? new Date(parseInt(charger.createdTime)).toLocaleString() : 'N/A'}
              </td>
              <td className="action-btns">
                <button className="edit-btn" onClick={() => handleOpenModal(charger)}>
                  <FaEdit />
                </button>
                <button className="delete-btn" onClick={() => handleDelete(charger.id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
          {chargers.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center' }}>No delivery charges found</td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FaTruck className="modal-icon" /> {editingCharger ? 'Edit Delivery Charge' : 'Add New Delivery Charge'}
              </h2>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Charge Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="charge"
                  value={formData.charge}
                  onChange={handleChange}
                  required
                  placeholder="Enter charge amount..."
                />
              </div>
              <div className="form-group status-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status === 'ACTIVE'}
                    onChange={handleChange}
                  />
                  Active (Will be applied to orders)
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryCharger;
