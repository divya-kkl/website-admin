import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import '../Banner/Banner.css'; // Reuse existing banner css

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
  mutation UpdateTopBanner($id: ID!, $input: TopBannerInput!) {
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
    try {
      setLoading(true);
      const data = await client.request(GET_ALL_TOP_BANNERS);
      setBanners(data.getAllTopBanners || []);
    } catch (err) {
      console.error('Error fetching top banners:', err);
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
        message: banner.message || '',
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        await client.request(UPDATE_TOP_BANNER, {
          id: editingBanner.id,
          input: { ...formData }
        });
      } else {
        await client.request(CREATE_TOP_BANNER, {
          input: { ...formData }
        });
      }
      fetchBanners();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving top banner:', err);
      alert('Failed to save top banner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this top banner?")) {
      try {
        await client.request(DELETE_TOP_BANNER, { id });
        fetchBanners();
      } catch (err) {
        console.error('Error deleting top banner:', err);
        alert('Failed to delete top banner');
      }
    }
  };

  return (
    <div className="banner-page">
      <div className="banner-card">
        <div className="banner-header">
          <h2 className="banner-title">Top Announcement Banners</h2>
          <button className="btn-add" onClick={() => handleOpenModal()}>
            <FaPlus /> Add New Top Banner
          </button>
        </div>

        <div className="table-responsive">
          <table className="banner-table">
            <thead>
              <tr>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{textAlign: 'center'}}>Loading...</td></tr>
              ) : banners.length === 0 ? (
                <tr><td colSpan="3" style={{textAlign: 'center'}}>No top banners found.</td></tr>
              ) : (
                banners.map(banner => (
                  <tr key={banner.id}>
                    <td>{banner.message}</td>
                    <td>
                      <span className={`badge ${banner.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" style={{color: '#f6c23e'}} onClick={() => handleOpenModal(banner)}>
                        <FaEdit />
                      </button>
                      <button className="btn-icon" style={{color: '#e74a3b'}} onClick={() => handleDelete(banner.id)}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? `Edit Top Banner` : `Add New Top Banner`}</h2>
              <button className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <div className="form-group">
                  <label>Message Content *</label>
                  <textarea name="message" required value={formData.message} onChange={handleChange} placeholder="Enter top banner message" rows="3" style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}}></textarea>
                </div>
                
                <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} id="isActiveCheckbox" />
                  <label htmlFor="isActiveCheckbox" style={{ marginBottom: 0 }}>Is Active</label>
                </div>
              </div>

              <div className="modal-footer">
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
