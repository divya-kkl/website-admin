import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import './TopBanner.css';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";
const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${localStorage.getItem('jwtToken')}`
  }
});

const GET_ALL_TOP_BANNERS = gql`
  query GetAllTopBanners {
    getAllTopBanners {
      id
      message
      isActive
      createdAt
    }
  }
`;

const CREATE_TOP_BANNER = gql`
  mutation CreateTopBanner($input: TopBannerInput!) {
    createTopBanner(input: $input) {
      id
    }
  }
`;

const UPDATE_TOP_BANNER = gql`
  mutation UpdateTopBanner($id: ID!, $input: UpdateTopBannerInput!) {
    updateTopBanner(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE_TOP_BANNER = gql`
  mutation DeleteTopBanner($id: ID!) {
    deleteTopBanner(id: $id)
  }
`;

function TopBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  
  const [formData, setFormData] = useState({
    message: '',
    isActive: true
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await client.request(GET_ALL_TOP_BANNERS);
      setBanners(data.getAllTopBanners || []);
    } catch (err) {
      console.error("Error fetching top banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        message: banner.message,
        isActive: banner.isActive
      });
    } else {
      setEditingBanner(null);
      setFormData({
        message: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await client.request(UPDATE_TOP_BANNER, {
          id: editingBanner.id,
          input: {
            message: formData.message,
            isActive: formData.isActive
          }
        });
      } else {
        await client.request(CREATE_TOP_BANNER, {
          input: {
            message: formData.message,
            isActive: formData.isActive
          }
        });
      }
      handleCloseModal();
      fetchBanners();
    } catch (err) {
      console.error("Error saving top banner:", err);
      alert("Failed to save banner. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this banner message?")) {
      try {
        await client.request(DELETE_TOP_BANNER, { id });
        fetchBanners();
      } catch (err) {
        console.error("Error deleting top banner:", err);
        alert("Failed to delete banner.");
      }
    }
  };

  if (loading && banners.length === 0) return <div>Loading top banners...</div>;

  return (
    <div className="top-banner-admin-container">
      <div className="top-banner-admin-header">
        <h2>Top Banner Messages</h2>
        <button className="add-btn" onClick={() => handleOpenModal()}>
          <FaPlus /> Add New Message
        </button>
      </div>

      <table className="top-banner-table">
        <thead>
          <tr>
            <th>Message</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((banner) => (
            <tr key={banner.id}>
              <td>{banner.message}</td>
              <td>
                <span className={`status-badge ${banner.isActive ? 'active' : 'inactive'}`}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="action-btns">
                <button className="edit-btn" onClick={() => handleOpenModal(banner)}>
                  <FaEdit />
                </button>
                <button className="delete-btn" onClick={() => handleDelete(banner.id)}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
          {banners.length === 0 && (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center' }}>No messages found</td>
            </tr>
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingBanner ? 'Edit Banner Message' : 'Add New Banner Message'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Message Text</label>
                <input
                  type="text"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Enter message text..."
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  Active (Will be displayed on website)
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="save-btn">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TopBanner;
