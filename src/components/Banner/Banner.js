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
      sideImage
      sideContent
      bannerType
      isActive
      fontColor
      fontSize
      buttonColor
      buttonSize
      contentPosition
      imagePosition
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
    sideImage: '',
    sideContent: '',
    fontColor: '#5c3516',
    fontSize: '16px',
    buttonColor: '',
    buttonSize: '16px',
    contentPosition: 'LEFT',
    imagePosition: 'RIGHT',
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
        sideImage: banner.sideImage || '',
        sideContent: banner.sideContent || '',
        fontColor: banner.fontColor || '#5c3516',
        fontSize: banner.fontSize || '16px',
        buttonColor: banner.buttonColor || '',
        buttonSize: banner.buttonSize || '16px',
        contentPosition: banner.contentPosition || 'LEFT',
        imagePosition: banner.imagePosition || 'RIGHT',
        isActive: banner.isActive
      });
    } else {
      setEditingBanner(null);
      setFormData({
        backgroundImage: '',
        sideImage: '',
        sideContent: '',
        fontColor: '#5c3516',
        fontSize: '16px',
        buttonColor: '',
        buttonSize: '16px',
        contentPosition: 'LEFT',
        imagePosition: 'RIGHT',
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
                <th>Background Image</th>
                <th>Side Image</th>
                <th>Side Content</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center'}}>Loading...</td></tr>
              ) : banners.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center'}}>No banners found for {title}.</td></tr>
              ) : (
                banners.map(banner => (
                  <tr key={banner.id}>
                    <td>
                      <img src={banner.backgroundImage} alt="Background" className="banner-image-preview" />
                    </td>
                    <td>
                      <img src={banner.sideImage} alt="Side" className="banner-image-preview" />
                    </td>
                    <td>
                      {banner.sideContent}
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
        <div className="modal-overlay" onClick={() => setViewModalBanner(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Banner Details</h2>
              <button className="btn-close" onClick={() => setViewModalBanner(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>Background Image:</strong>
                <img src={viewModalBanner.backgroundImage} alt="Background" style={{ width: '100%', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ display: 'block', marginBottom: '5px' }}>Side Image:</strong>
                <img src={viewModalBanner.sideImage} alt="Side" style={{ width: '150px', borderRadius: '4px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Side Content Preview:</strong> 
                <div style={{ marginTop: '5px', padding: '10px', border: '1px dashed #ccc', borderRadius: '4px', color: viewModalBanner.fontColor, fontSize: isNaN(viewModalBanner.fontSize) ? viewModalBanner.fontSize : `${viewModalBanner.fontSize}px` }}>
                  {viewModalBanner.sideContent}
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Status:</strong> <span className={`badge ${viewModalBanner.isActive ? 'badge-active' : 'badge-inactive'}`}>
                  {viewModalBanner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <strong>Font Color:</strong> <span style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: viewModalBanner.fontColor, borderRadius: '2px', marginLeft: '5px', verticalAlign: 'middle', border: '1px solid #ccc' }}></span> {viewModalBanner.fontColor}
                </div>
                <div>
                  <strong>Title Font Size:</strong> {viewModalBanner.fontSize}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <strong>Button Color:</strong> {viewModalBanner.buttonColor ? <><span style={{ display: 'inline-block', width: '15px', height: '15px', backgroundColor: viewModalBanner.buttonColor, borderRadius: '2px', marginLeft: '5px', verticalAlign: 'middle', border: '1px solid #ccc' }}></span> {viewModalBanner.buttonColor}</> : 'Default'}
                </div>
                <div>
                  <strong>Button Size:</strong> {viewModalBanner.buttonSize}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <strong>Content Position:</strong> {viewModalBanner.contentPosition || 'LEFT'}
                </div>
                <div>
                  <strong>Image Position:</strong> {viewModalBanner.imagePosition || 'RIGHT'}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setViewModalBanner(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? `Edit ${title}` : `Add New ${title}`}</h2>
              <button className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <div className="form-group">
                  <label>Background Image *</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'backgroundImage')} disabled={uploadingImage} required={!formData.backgroundImage} />
                  {formData.backgroundImage && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={formData.backgroundImage} alt="Background Preview" style={{ width: '100px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Side Image *</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'sideImage')} disabled={uploadingImage} required={!formData.sideImage} />
                  {formData.sideImage && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={formData.sideImage} alt="Side Preview" style={{ width: '100px', border: '1px solid #ddd', borderRadius: '4px' }} />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Side Content *</label>
                  <textarea name="sideContent" required value={formData.sideContent} onChange={handleChange} placeholder="Enter side content text (use Enter for new lines)" rows="3" style={{width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc'}}></textarea>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Font Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="color" name="fontColor" value={formData.fontColor} onChange={handleChange} style={{ padding: '0', width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                      <span style={{ fontSize: '14px', color: '#555' }}>{formData.fontColor}</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Title Font Size</label>
                    <input 
                      type="text" 
                      name="fontSize" 
                      value={formData.fontSize} 
                      onChange={handleChange} 
                      placeholder="e.g., 24px" 
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
                    />
                  </div>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Button Color (Optional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input type="color" name="buttonColor" value={formData.buttonColor} onChange={handleChange} style={{ padding: '0', width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                      <span style={{ fontSize: '14px', color: '#555' }}>{formData.buttonColor || 'Default'}</span>
                    </div>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Button Font Size</label>
                    <input 
                      type="text" 
                      name="buttonSize" 
                      value={formData.buttonSize} 
                      onChange={handleChange} 
                      placeholder="e.g., 16px" 
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
                    />
                  </div>
                </div>
                <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Content Position</label>
                    <select name="contentPosition" value={formData.contentPosition} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                      <option value="LEFT">Left</option>
                      <option value="CENTER">Center</option>
                      <option value="RIGHT">Right</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Image Position</label>
                    <select name="imagePosition" value={formData.imagePosition} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                      <option value="LEFT">Left</option>
                      <option value="CENTER">Center</option>
                      <option value="RIGHT">Right</option>
                    </select>
                  </div>
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

export default Banner;
