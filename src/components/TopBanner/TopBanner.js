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
        <div className="modal-overlay" onClick={handleCloseModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEdit color="#4a90e2" /> {editingBanner ? 'Edit Banner Message' : 'Add New Banner Message'}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Message Text *</label>
                <input
                  type="text"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Enter message text..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '500', color: '#333', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Active (Will be displayed on website)
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  style={{ padding: '10px 20px', background: '#fff', color: '#555', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.color = '#4a90e2'; e.currentTarget.style.borderColor = '#4a90e2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#d9d9d9'; }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#357abd'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#4a90e2'}
                >
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

export default TopBanner;
