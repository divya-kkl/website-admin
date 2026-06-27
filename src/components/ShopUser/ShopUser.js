import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaEdit, FaTrash, FaPlus, FaEllipsisV, FaSearch } from 'react-icons/fa';
import './ShopUser.css';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";
const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${localStorage.getItem('jwtToken')}`
  }
});

const GET_ALL_SHOP_USERS = gql`
  query GetAllShopUsersPaginated($search: String, $page: Int, $limit: Int) {
    getAllShopUsersPaginated(search: $search, page: $page, limit: $limit) {
      users {
        id
        shopName
        ownerName
        email
        contactNumber
        address
        image
        createdAt
      }
      totalCount
    }
  }
`;

const REGISTER_SHOP_USER = gql`
  mutation RegisterShopUser($input: RegisterShopUserInput!) {
    registerShopUser(input: $input) {
      user {
        id
      }
    }
  }
`;

const UPDATE_SHOP_USER = gql`
  mutation UpdateShopUser($id: ID!, $input: UpdateShopUserInput!) {
    updateShopUser(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE_SHOP_USER = gql`
  mutation DeleteShopUser($id: ID!) {
    deleteShopUser(id: $id)
  }
`;

function ShopUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(totalCount / limit);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    password: '',
    contactNumber: '',
    address: '',
    image: '',
    gstNumber: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await client.request(GET_ALL_SHOP_USERS, { search: searchTerm, page, limit });
      setUsers(data.getAllShopUsersPaginated?.users || []);
      setTotalCount(data.getAllShopUsersPaginated?.totalCount || 0);
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
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page]);

  const handleOpenModal = (user = null) => {
    setOpenDropdownId(null);
    if (user) {
      setEditingUser(user);
      setFormData({
        shopName: user.shopName || '',
        ownerName: user.ownerName || '',
        email: user.email || '',
        password: '',
        contactNumber: user.contactNumber || '',
        address: user.address || '',
        image: user.image || '',
        gstNumber: user.gstNumber || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        shopName: '',
        ownerName: '',
        email: '',
        password: '',
        contactNumber: '',
        address: '',
        image: '',
        gstNumber: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      setFormData(prev => ({ ...prev, image: fileData.secure_url }));
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const inputData = {
      shopName: formData.shopName,
      ownerName: formData.ownerName,
      contactNumber: formData.contactNumber,
      address: formData.address,
      image: formData.image
    };

    try {
      if (editingUser) {
        await client.request(UPDATE_SHOP_USER, {
          id: editingUser.id,
          input: inputData
        });
      } else {
        if (!formData.password || !formData.email) {
          alert("Email and Password are required for new shop users.");
          return;
        }
        await client.request(REGISTER_SHOP_USER, {
          input: { 
            ...inputData, 
            email: formData.email, 
            password: formData.password,
            gstNumber: formData.gstNumber
          }
        });
      }
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      alert("Error saving shop user: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    setOpenDropdownId(null);
    if (window.confirm("Are you sure you want to delete this shop user?")) {
      try {
        await client.request(DELETE_SHOP_USER, { id });
        fetchUsers();
      } catch (err) {
        alert("Failed to delete shop user: " + err.message);
      }
    }
  };

  if (error) return <div className="user-error">Error loading shop users: {error.message}</div>;

  return (
    <div className="user-page">
      <div className="user-card">
        <div className="user-header">
          <h2>Shop Users Management</h2>
          <div className="header-actions">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search name, email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="add-btn" onClick={() => handleOpenModal()}>
              <FaPlus /> Add Shop User
            </button>
          </div>
        </div>

        <div className="user-table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Shop Name</th>
                <th>Owner Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{textAlign: 'center'}}>Loading...</td></tr>
              ) : users.map((user, index) => (
                <tr key={user.id}>
                  <td>{(page - 1) * limit + index + 1}</td>
                  <td style={{ fontWeight: '600' }}>{user.shopName}</td>
                  <td>{user.ownerName}</td>
                  <td>{user.email}</td>
                  <td>{user.contactNumber || 'N/A'}</td>
                  <td className="relative-cell">
                    <button 
                      className="action-btn"
                      onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                    >
                      <FaEllipsisV />
                    </button>
                    {openDropdownId === user.id && (
                      <div className="dropdown-menu">
                        <button className="dropdown-item" onClick={() => handleOpenModal(user)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaEdit style={{ color: '#f59e0b', marginRight: '10px' }} /> <span style={{ fontWeight: '600' }}>Edit</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleDelete(user.id)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaTrash style={{ color: '#ef4444', marginRight: '10px' }} /> <span style={{ fontWeight: '600' }}>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-table-msg">No shop users found.</td>
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

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEdit color="#4a90e2" /> {editingUser ? "Edit Shop User" : "Add New Shop User"}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Shop Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Shop Name *</label>
                    <input type="text" name="shopName" required value={formData.shopName} onChange={handleChange} placeholder="Enter shop name" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Owner Name *</label>
                    <input type="text" name="ownerName" required value={formData.ownerName} onChange={handleChange} placeholder="Enter owner name" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Email *</label>
                    <input type="email" name="email" required={!editingUser} disabled={!!editingUser} value={formData.email} onChange={handleChange} placeholder="Enter email" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px', backgroundColor: editingUser ? '#f5f5f5' : '#fff' }} />
                  </div>
                  {!editingUser && (
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Password *</label>
                      <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Enter password" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                    </div>
                  )}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Contact Number *</label>
                    <input type="text" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} placeholder="Enter contact number" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  {!editingUser && (
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>GST Number</label>
                      <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} placeholder="Enter GST number" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Additional Details</h3>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Address</label>
                  <textarea rows="2" name="address" value={formData.address} onChange={handleChange} placeholder="Enter address..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px', resize: 'vertical' }}></textarea>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Shop Image (Optional)</label>
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
                    ) : formData.image ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <img src={formData.image} alt="Shop" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
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
                  {editingUser ? "Update Shop User" : "Save Shop User"}
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

export default ShopUser;
