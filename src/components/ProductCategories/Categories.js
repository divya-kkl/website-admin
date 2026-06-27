import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaEdit, FaTrash, FaPlus, FaImage, FaEllipsisV, FaEye } from 'react-icons/fa';
import './Categories.css';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";
const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${localStorage.getItem('jwtToken')}`
  }
});

const GET_ALL_CATEGORIES = gql`
  query GetAllProductCategories($search: String, $page: Int, $limit: Int) {
    getAllProductCategories(search: $search, page: $page, limit: $limit) {
      categories {
        id
        name
        code
        description
        imageUrl
        status
        parentCategoryId
        createdTime
      }
      totalCount
    }
  }
`;

const CREATE_CATEGORY = gql`
  mutation CreateProductCategory($input: CreateProductCategoryInput!) {
    createProductCategory(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_CATEGORY = gql`
  mutation UpdateProductCategory($id: ID!, $input: UpdateProductCategoryInput!) {
    updateProductCategory(id: $id, input: $input) {
      id
      name
    }
  }
`;

const DELETE_CATEGORY = gql`
  mutation DeleteProductCategory($id: ID!) {
    deleteProductCategory(id: $id)
  }
`;

function Categories() {
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(totalCount / limit);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('error'); // 'success' or 'error'

  const showToast = (message, type = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [viewModalCategory, setViewModalCategory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    imageUrl: '',
    status: 'ACTIVE',
    parentCategoryId: ''
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await client.request(GET_ALL_CATEGORIES, { search: searchTerm, page, limit });
      setFilteredCategories(data.getAllProductCategories?.categories || []);
      setTotalCount(data.getAllProductCategories?.totalCount || 0);
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
      fetchCategories();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page]);

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
      setFormData(prev => ({ ...prev, imageUrl: fileData.secure_url }));
    } catch (err) {
      showToast("Image upload failed. Please try again.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenModal = (category = null) => {
    setOpenDropdownId(null);
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        code: category.code || '',
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        status: category.status || 'ACTIVE',
        parentCategoryId: category.parentCategoryId || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        imageUrl: '',
        status: 'ACTIVE',
        parentCategoryId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const openViewDetails = (category) => {
    setViewModalCategory(category);
    setOpenDropdownId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await client.request(UPDATE_CATEGORY, {
          id: editingCategory.id,
          input: {
            name: formData.name,
            code: formData.code,
            description: formData.description,
            imageUrl: formData.imageUrl,
            status: formData.status,
            parentCategoryId: formData.parentCategoryId || null
          }
        });
      } else {
        await client.request(CREATE_CATEGORY, {
          input: {
            name: formData.name,
            code: formData.code,
            description: formData.description,
            imageUrl: formData.imageUrl,
            status: formData.status,
            parentCategoryId: formData.parentCategoryId || null
          }
        });
      }
      fetchCategories();
      handleCloseModal();
      showToast("Category saved successfully", "success");
    } catch (err) {
      showToast("Error saving category: " + err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    setOpenDropdownId(null);
    try {
      await client.request(DELETE_CATEGORY, { id });
      fetchCategories();
      showToast("Category deleted successfully", "success");
    } catch (err) {
      const errorMessage = err.response?.errors?.[0]?.message || "Failed to delete category";
      showToast(errorMessage, "error");
    }
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-active';
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

  if (error) return <div className="categories-error">Error loading categories: {error.message}</div>;

  return (
    <div className="categories-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: toastType === 'error' ? '#f44336' : '#4caf50',
          color: 'white',
          padding: '16px',
          borderRadius: '4px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          zIndex: 10000,
          fontWeight: '500',
          transition: 'opacity 0.3s',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            style={{
              background: 'none', border: 'none', color: 'white', 
              fontSize: '18px', cursor: 'pointer', marginLeft: '10px'
            }}>
            &times;
          </button>
        </div>
      )}
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
      <div className="categories-card">
        <div className="categories-header">
          <h2>Product Categories</h2>
          <div className="header-actions">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="add-btn" onClick={() => handleOpenModal()}>
              <FaPlus /> Add Category
            </button>
          </div>
        </div>

        <div className="categories-table-wrapper">
          <table className="categories-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Image</th>
                <th>Name</th>
                <th>Code</th>
                <th>Description</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Created Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    {Array.from({ length: 9 }).map((_, cIdx) => (
                      <td key={cIdx} style={{ padding: '15px' }}>
                        <div className="shimmer-box" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredCategories.map((cat, index) => (
                <tr key={cat.id}>
                  <td>{(page - 1) * limit + index + 1}</td>
                  <td>
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="cat-img-preview" />
                    ) : (
                      <div className="cat-img-placeholder"><FaImage /></div>
                    )}
                  </td>
                  <td>{cat.name}</td>
                  <td>{cat.code}</td>
                  <td className="desc-cell">{cat.description || "N/A"}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(cat.status)}`}>
                      {cat.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    {/* Assuming Featured is 'No' for now as it's not in the schema */}
                    <span style={{ color: '#858796' }}>No</span>
                  </td>
                  <td>{formatDateTime(cat.createdTime)}</td>
                  <td className="relative-cell">
                    <button 
                      className="action-btn"
                      onClick={() => setOpenDropdownId(openDropdownId === cat.id ? null : cat.id)}
                    >
                      <FaEllipsisV />
                    </button>
                    {openDropdownId === cat.id && (
                      <div className="dropdown-menu">
                        <button className="dropdown-item" onClick={() => openViewDetails(cat)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaEye style={{ color: '#3b82f6', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>View Details</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleOpenModal(cat)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaEdit style={{ color: '#f59e0b', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Edit</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleDelete(cat.id)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaTrash style={{ color: '#ef4444', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#858796' }}>No categories found.</td>
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

      {/* View Details Modal */}
      {viewModalCategory && (
        <div className="modal-overlay" onClick={() => setViewModalCategory(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEye color="#4a90e2" /> Category Details
              </h2>
              <button onClick={() => setViewModalCategory(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '15px', color: '#555' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                {viewModalCategory.imageUrl ? (
                   <img src={viewModalCategory.imageUrl} alt={viewModalCategory.name} style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                ) : (
                   <div style={{ width: '120px', height: '120px', borderRadius: '12px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #d9d9d9' }}><FaImage size={40} color="#ccc" /></div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Name:</strong> <span>{viewModalCategory.name}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Code:</strong> <span>{viewModalCategory.code}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Status:</strong> <span><span className={`status-badge ${getStatusClass(viewModalCategory.status)}`}>{viewModalCategory.status}</span></span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}><strong>Description:</strong> <span>{viewModalCategory.description || "N/A"}</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}><strong>Created Time:</strong> <span>{formatDateTime(viewModalCategory.createdTime)}</span></div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => setViewModalCategory(null)} style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }} onMouseOver={(e) => e.currentTarget.style.background = '#357abd'} onMouseOut={(e) => e.currentTarget.style.background = '#4a90e2'}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEdit color="#4a90e2" /> {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Category Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Name *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="E.g. Electronics" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Code *</label>
                    <input type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="E.g. ELEC" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Description</label>
                    <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Category description..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px', resize: 'vertical' }}></textarea>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px', backgroundColor: '#fff' }}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Category Image (Optional)</h3>
                <div style={{ border: '2px dashed #d9d9d9', borderRadius: '8px', padding: '20px', textAlign: 'center', backgroundColor: '#fafafa', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }} className="upload-zone">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage ? (
                    <div style={{ color: '#4a90e2', fontWeight: '500', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid #4a90e2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Uploading image...
                    </div>
                  ) : formData.imageUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <img src={formData.imageUrl} alt="Category" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                      <span style={{ color: '#666', fontSize: '13px' }}>Click or drag to replace image</span>
                    </div>
                  ) : (
                    <div style={{ color: '#888', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#bfbfbf' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      <span style={{ fontWeight: '500' }}>Click to upload an image</span>
                      <span style={{ fontSize: '12px' }}>JPG, PNG or GIF (Max. 5MB)</span>
                    </div>
                  )}
                </div>
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
                  disabled={uploadingImage}
                  style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: uploadingImage ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }}
                  onMouseOver={(e) => { if(!uploadingImage) e.currentTarget.style.background = '#357abd'; }}
                  onMouseOut={(e) => { if(!uploadingImage) e.currentTarget.style.background = '#4a90e2'; }}
                >
                  {editingCategory ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
          <style>
            {`
              @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .upload-zone:hover {
                border-color: #4a90e2 !important;
                background-color: #f4f8fd !important;
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
}

export default Categories;
