import React, { useState, useEffect } from 'react';
import { GraphQLClient, gql } from 'graphql-request';
import { FaEdit, FaTrash, FaPlus, FaEllipsisV, FaEye, FaSearch } from 'react-icons/fa';
import './User.css';

const GRAPHQL_ENDPOINT = process.env.REACT_APP_GRAPHQL_ENDPOINT || "http://localhost:2000/graphql";
const client = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    authorization: `Bearer ${localStorage.getItem('jwtToken')}`
  }
});

const GET_ALL_USERS = gql`
  query GetAllUser($search: String, $page: Int, $limit: Int) {
    getAllUser(search: $search, page: $page, limit: $limit) {
      users {
        id
        username
        email
        country
        state
        city
        address
        phone_number
        pincode
        gender
        addresses {
          id
          firstName
          lastName
          address
          apartment
          city
          state
          pincode
          country
          phone
          isDefault
        }
      }
      totalCount
    }
  }
`;

const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterInput!) {
    registerUser(input: $input) {
      user {
        id
      }
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

function User() {
  const [filteredUsers, setFilteredUsers] = useState([]);
  
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
  const [viewModalUser, setViewModalUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone_number: '',
    country: '',
    state: '',
    city: '',
    address: '',
    pincode: '',
    gender: 'MALE'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await client.request(GET_ALL_USERS, { search: searchTerm, page, limit });
      setFilteredUsers(data.getAllUser?.users || []);
      setTotalCount(data.getAllUser?.totalCount || 0);
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
        username: user.username || '',
        email: user.email || '',
        password: '', // Password not needed for update
        phone_number: user.phone_number || '',
        country: user.country || '',
        state: user.state || '',
        city: user.city || '',
        address: user.address || '',
        pincode: user.pincode || '',
        gender: user.gender || 'MALE'
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        country: '',
        state: '',
        city: '',
        address: '',
        pincode: '',
        gender: 'MALE'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const openViewDetails = (user) => {
    setViewModalUser(user);
    setOpenDropdownId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const inputData = {
      username: formData.username,
      email: formData.email,
      phone_number: formData.phone_number,
      country: formData.country,
      state: formData.state,
      city: formData.city,
      address: formData.address,
      pincode: formData.pincode,
      gender: formData.gender
    };

    try {
      if (editingUser) {
        await client.request(UPDATE_USER, {
          id: editingUser.id,
          input: inputData
        });
      } else {
        if (!formData.password) {
          alert("Password is required for new users.");
          return;
        }
        await client.request(REGISTER_USER, {
          input: { ...inputData, password: formData.password }
        });
      }
      fetchUsers();
      handleCloseModal();
    } catch (err) {
      alert("Error saving user: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    setOpenDropdownId(null);
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await client.request(DELETE_USER, { id });
        fetchUsers();
      } catch (err) {
        alert("Failed to delete user: " + err.message);
      }
    }
  };

  if (error) return <div className="user-error">Error loading users: {error.message}</div>;

  return (
    <div className="user-page">
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
      <div className="user-card">
        <div className="user-header">
          <h2>Users Management</h2>
          <div className="header-actions">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search name, email, phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="add-btn" onClick={() => handleOpenModal()}>
              <FaPlus /> Add User
            </button>
          </div>
        </div>

        <div className="user-table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone Number</th>
                <th>City / State</th>
                <th>Gender</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    {Array.from({ length: 7 }).map((_, cIdx) => (
                      <td key={cIdx} style={{ padding: '15px' }}>
                        <div className="shimmer-box" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td style={{ fontWeight: '600' }}>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.phone_number || 'N/A'}</td>
                  <td>{user.city ? `${user.city}, ${user.state || ''}` : 'N/A'}</td>
                  <td>
                    <span className={`gender-badge gender-${user.gender?.toLowerCase() || 'other'}`}>
                      {user.gender || 'OTHER'}
                    </span>
                  </td>
                  <td className="relative-cell">
                    <button 
                      className="action-btn"
                      onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                    >
                      <FaEllipsisV />
                    </button>
                    {openDropdownId === user.id && (
                      <div className="dropdown-menu">
                        <button className="dropdown-item" onClick={() => openViewDetails(user)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaEye style={{ color: '#3b82f6', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>View Details</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleOpenModal(user)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaEdit style={{ color: '#f59e0b', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Edit</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleDelete(user.id)} style={{ display: 'flex', alignItems: 'center' }}>
                          <FaTrash style={{ color: '#ef4444', marginRight: '10px', fontSize: '15px' }} /> <span style={{ fontWeight: '600' }}>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-table-msg">No users found.</td>
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
      {viewModalUser && (
        <div className="modal-overlay" onClick={() => setViewModalUser(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '30px', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEye color="#4a90e2" /> User Details
              </h2>
              <button onClick={() => setViewModalUser(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '15px', color: '#555' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '15px', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#4a90e2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(74,144,226,0.3)' }}>
                  {viewModalUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#333' }}>{viewModalUser.username}</h3>
                  <p style={{ margin: 0, color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    {viewModalUser.email}
                  </p>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '10px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block', alignSelf: 'flex-start' }}>Personal Info</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '5px' }}>
                <strong>Phone Number:</strong> <span>{viewModalUser.phone_number || "N/A"}</span>
                <strong>Gender:</strong> <span><span className={`gender-badge gender-${viewModalUser.gender?.toLowerCase() || 'other'}`}>{viewModalUser.gender || 'N/A'}</span></span>
              </div>

              <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '10px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block', alignSelf: 'flex-start' }}>Address & Location</h3>
              {viewModalUser.addresses && viewModalUser.addresses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {viewModalUser.addresses.map((addr, idx) => (
                    <div key={idx} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', background: '#fafafa', position: 'relative' }}>
                      {addr.isDefault && <span style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '11px', background: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>Default</span>}
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333', fontSize: '16px' }}>{addr.firstName} {addr.lastName}</div>
                      <div style={{ color: '#555', marginBottom: '4px' }}>{addr.address}{addr.apartment ? `, ${addr.apartment}` : ''}</div>
                      <div style={{ color: '#555', marginBottom: '4px' }}>{addr.city}, {addr.state} - {addr.pincode}</div>
                      <div style={{ color: '#555', marginBottom: '8px' }}>{addr.country}</div>
                      <div style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> {addr.phone}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                  <strong>Address:</strong> <span>{viewModalUser.address || "N/A"}</span>
                  <strong>City:</strong> <span>{viewModalUser.city || "N/A"}</span>
                  <strong>State:</strong> <span>{viewModalUser.state || "N/A"}</span>
                  <strong>Country:</strong> <span>{viewModalUser.country || "N/A"}</span>
                  <strong>Pincode:</strong> <span>{viewModalUser.pincode || "N/A"}</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <button onClick={() => setViewModalUser(null)} style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }} onMouseOver={(e) => e.currentTarget.style.background = '#357abd'} onMouseOut={(e) => e.currentTarget.style.background = '#4a90e2'}>Close</button>
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
                <FaEdit color="#4a90e2" /> {editingUser ? "Edit User Details" : "Add New User"}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', transition: 'color 0.2s' }}>&times;</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Account Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Username *</label>
                    <input type="text" name="username" required value={formData.username} onChange={handleChange} placeholder="Enter username" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Email *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="Enter email address" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  {!editingUser && (
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Password *</label>
                      <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Enter password" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                    </div>
                  )}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Phone Number</label>
                    <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Enter phone number" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px', backgroundColor: '#fff' }}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '16px', color: '#4a90e2', marginBottom: '15px', borderBottom: '2px solid #4a90e2', paddingBottom: '5px', display: 'inline-block' }}>Location Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Full Address</label>
                    <textarea rows="2" name="address" value={formData.address} onChange={handleChange} placeholder="Enter street address..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px', resize: 'vertical' }}></textarea>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Enter state" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Country</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Enter country" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#555', fontSize: '14px' }}>Pincode</label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Enter pincode" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '14px' }} />
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
                  style={{ padding: '10px 24px', background: '#4a90e2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 2px 6px rgba(74, 144, 226, 0.3)' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#357abd'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#4a90e2'}
                >
                  {editingUser ? "Update User" : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default User;
