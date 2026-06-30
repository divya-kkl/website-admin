import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaEdit, FaTrash, FaPlus, FaEye } from 'react-icons/fa';
import './Banner.css';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";
const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${localStorage.getItem('jwtToken')}`
  }
});

const GET_ALL_BANNERS = gql`
  query GetAllBanners($bannerType: String) {
    getAllBanners(bannerType: $bannerType) {
      id
      backgroundImage
      bannerType
      isActive
      createdAt
    }
  }
`;

const CREATE_BANNER = gql`
  mutation CreateBanner($input: BannerInput!) {
    createBanner(input: $input) {
      id
    }
  }
`;

const UPDATE_BANNER = gql`
  mutation UpdateBanner($id: ID!, $input: UpdateBannerInput!) {
    updateBanner(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE_BANNER = gql`
  mutation DeleteBanner($id: ID!) {
    deleteBanner(id: $id)
  }
`;

function Banner({ bannerType, title }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewModalBanner, setViewModalBanner] = useState(null);

  const [formData, setFormData] = useState({
    backgroundImage: '',
    isActive: true
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await client.request(GET_ALL_BANNERS, { bannerType });
      setBanners(data.getAllBanners || []);
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();

  }, [bannerType]);

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        backgroundImage: banner.backgroundImage || '',
        isActive: banner.isActive
      });
    } else {
      setEditingBanner(null);
      setFormData({
        backgroundImage: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "image_e-commerce");

      const res = await fetch("https://api.cloudinary.com/v1_1/dvhtqze0j/image/upload", {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      setFormData(prev => ({ ...prev, [field]: fileData.secure_url }));
    } catch (err) {
      alert("Image upload failed. Please try again.");
    } finally {
      setUploadingImage(false);
    }
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
        await client.request(UPDATE_BANNER, {
          id: editingBanner.id,
          input: {
            ...formData,
            bannerType
          }
        });
      } else {
        await client.request(CREATE_BANNER, {
          input: {
            ...formData,
            bannerType
          }
        });
      }
      fetchBanners();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving banner:', err);
      alert('Failed to save banner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      try {
        await client.request(DELETE_BANNER, { id });
        fetchBanners();
      } catch (err) {
        console.error('Error deleting banner:', err);
        alert('Failed to delete banner');
      }
    }
  };

  return (
    <div className="banner-page">
      <div className="banner-card">
        <div className="banner-header">
          <h2 className="banner-title">{title} Management</h2>
          <button className="btn-add" onClick={() => handleOpenModal()}>
            <FaPlus /> Add New Banner
          </button>
        </div>

        <div className="table-responsive">
          <table className="banner-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" style={{textAlign: 'center'}}>Loading...</td></tr>
              ) : banners.length === 0 ? (
                <tr><td colSpan="3" style={{textAlign: 'center'}}>No banners found for {title}.</td></tr>
              ) : (
                banners.map(banner => (
                  <tr key={banner.id}>
                    <td>
                      <img src={banner.backgroundImage} alt="Banner" className="banner-image-preview" style={{width: '120px', height: 'auto', borderRadius: '4px', border: '1px solid #eee'}} />
                    </td>
                    <td>
                      <span className={`badge ${banner.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" style={{color: '#3b82f6'}} onClick={() => setViewModalBanner(banner)}>
                        <FaEye />
                      </button>
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

      {/* View Details Modal */}
      {viewModalBanner && (
        <div className="modal-overlay" onClick={() => setViewModalBanner(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEye color="#4a90e2" /> Banner Details
              </h2>
              <button onClick={() => setViewModalBanner(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px', color: '#555' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '10px', color: '#333', fontSize: '16px' }}>Image:</strong>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee', background: '#fafafa', padding: '10px' }}>
                  <img src={viewModalBanner.backgroundImage} alt="Banner" style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                </div>
              </div>

              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Status</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge ${viewModalBanner.isActive ? 'badge-active' : 'badge-inactive'}`}>
                    {viewModalBanner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => setViewModalBanner(null)} style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }} onMouseOver={(e) => e.currentTarget.style.background = '#357abd'} onMouseOut={(e) => e.currentTarget.style.background = '#4a90e2'}>Close</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEdit color="#4a90e2" /> {editingBanner ? `Edit ${title}` : `Add New ${title}`}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                
                <div style={{ marginBottom: '25px' }}>
                  <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Media Asset</h3>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Banner Image *</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'backgroundImage')} disabled={uploadingImage} required={!formData.backgroundImage} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
                    {formData.backgroundImage && (
                      <div style={{ marginTop: '10px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #eee', background: '#fafafa', padding: '10px' }}>
                        <img src={formData.backgroundImage} alt="Banner Preview" style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '500', color: '#333', fontSize: '14px', margin: 0 }}>
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    Active (Will be displayed on website)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '15px', paddingTop: '20px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
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
                  disabled={uploadingImage}
                  style={{ padding: '10px 24px', background: uploadingImage ? '#a0c4f0' : '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: uploadingImage ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }}
                  onMouseOver={(e) => !uploadingImage && (e.currentTarget.style.background = '#357abd')}
                  onMouseOut={(e) => !uploadingImage && (e.currentTarget.style.background = '#4a90e2')}
                >
                  {uploadingImage ? 'Uploading...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Banner;
