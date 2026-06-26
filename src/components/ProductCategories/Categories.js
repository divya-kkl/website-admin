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

const GET_TOTAL_CATEGORIES_COUNT = gql`
  query GetTotalProductCategoriesCount($search: String) {
    getTotalProductCategoriesCount(search: $search)
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
      const [data, countData] = await Promise.all([
        client.request(GET_ALL_CATEGORIES, { search: searchTerm, page, limit }),
        client.request(GET_TOTAL_CATEGORIES_COUNT, { search: searchTerm })
      ]);
      setFilteredCategories(data.getAllProductCategories?.categories || []);
      setTotalCount(data.getAllProductCategories?.totalCount || countData.getTotalProductCategoriesCount || 0);
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
                  <td>{index + 1}</td>
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
        <div className="modal-overlay" onClick={() => setViewModalCategory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '400px', padding: '25px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eaeaea', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontFamily: "'Times New Roman', Times, serif" }}>Category Details</h2>
              <button onClick={() => setViewModalCategory(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: 'sans-serif', fontSize: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                {viewModalCategory.imageUrl ? (
                   <img src={viewModalCategory.imageUrl} alt={viewModalCategory.name} style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                ) : (
                   <div style={{ width: '100px', height: '100px', borderRadius: '8px', background: '#eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaImage size={30} color="#ccc" /></div>
                )}
              </div>
              <div><strong>Name:</strong> {viewModalCategory.name}</div>
              <div><strong>Code:</strong> {viewModalCategory.code}</div>
              <div><strong>Status:</strong> <span className={`status-badge ${getStatusClass(viewModalCategory.status)}`}>{viewModalCategory.status}</span></div>
              <div><strong>Description:</strong> {viewModalCategory.description || "N/A"}</div>
              <div><strong>Created Time:</strong> {formatDateTime(viewModalCategory.createdTime)}</div>
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setViewModalCategory(null)} style={{ padding: '8px 25px', background: '#4a5568', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '450px' }}>
            <div className="modal-header">
              <h2>{editingCategory ? "Edit Category" : "Add New Category"}</h2>
              <button className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group">
                <label>Category Image</label>
                <div className="image-upload-wrapper">
                  <div className="image-preview-box">
                    {uploadingImage ? (
                      <span className="upload-text">Uploading...</span>
                    ) : formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Category" />
                    ) : (
                      <span className="placeholder-text">No image selected</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="file-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    placeholder="E.g. Electronics"
                  />
                </div>
                <div className="form-group">
                  <label>Code *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value})} 
                    placeholder="E.g. ELEC"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows="3"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Category description..."
                ></textarea>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={uploadingImage}>
                  {editingCategory ? "Update Category" : "Save Category"}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
