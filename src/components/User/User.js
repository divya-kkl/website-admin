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

const GET_TOTAL_USER_COUNT = gql`
  query GetTotalUserCount($search: String) {
    getTotalUserCount(search: $search)
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
      const [data, countData] = await Promise.all([
        client.request(GET_ALL_USERS, { search: searchTerm, page, limit }),
        client.request(GET_TOTAL_USER_COUNT, { search: searchTerm })
      ]);
      setFilteredUsers(data.getAllUser?.users || []);
      setTotalCount(countData.getTotalUserCount || 0);
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
        <div className="modal-overlay" onClick={() => setViewModalUser(null)}>
          <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="btn-close" onClick={() => setViewModalUser(null)}>&times;</button>
            </div>
            
            <div className="modal-body scrollable-body">
              <div className="user-profile-header">
                <div className="user-avatar">
                  {viewModalUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-title-info">
                  <h3>{viewModalUser.username}</h3>
                  <p>{viewModalUser.email}</p>
                </div>
              </div>

              <div className="view-section-title">Personal Info</div>
              <div className="view-info-grid">
                <div><strong>Phone Number:</strong> {viewModalUser.phone_number || "N/A"}</div>
                <div>
                  <strong>Gender:</strong> 
                  <span className={`gender-badge gender-${viewModalUser.gender?.toLowerCase() || 'other'}`} style={{marginLeft: '10px'}}>
                    {viewModalUser.gender || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="view-section-title">Address & Location</div>
              {viewModalUser.addresses && viewModalUser.addresses.length > 0 ? (
                <div className="addresses-list">
                  {viewModalUser.addresses.map((addr, idx) => (
                    <div key={idx} className="address-card" style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {addr.firstName} {addr.lastName}
                        {addr.isDefault && <span style={{ marginLeft: '10px', fontSize: '12px', background: '#e0f7fa', color: '#006064', padding: '2px 5px', borderRadius: '3px' }}>Default</span>}
                      </div>
                      <div style={{ fontSize: '14px', color: '#555' }}>{addr.address}{addr.apartment ? `, ${addr.apartment}` : ''}</div>
                      <div style={{ fontSize: '14px', color: '#555' }}>{addr.city}, {addr.state} - {addr.pincode}</div>
                      <div style={{ fontSize: '14px', color: '#555' }}>{addr.country}</div>
                      <div style={{ fontSize: '14px', color: '#555', marginTop: '5px' }}><strong>Phone:</strong> {addr.phone}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="view-info-grid">
                  <div><strong>Address:</strong> {viewModalUser.address || "N/A"}</div>
                  <div><strong>City:</strong> {viewModalUser.city || "N/A"}</div>
                  <div><strong>State:</strong> {viewModalUser.state || "N/A"}</div>
                  <div><strong>Country:</strong> {viewModalUser.country || "N/A"}</div>
                  <div><strong>Pincode:</strong> {viewModalUser.pincode || "N/A"}</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setViewModalUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? "Edit User Details" : "Add New User"}</h2>
              <button className="btn-close" onClick={handleCloseModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-body scrollable-body">
              <div className="form-section">
                <h3>Account Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Username *</label>
                    <input type="text" name="username" required value={formData.username} onChange={handleChange} placeholder="Enter username" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="Enter email address" />
                  </div>
                </div>
                {!editingUser && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Password *</label>
                      <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="Enter password" />
                    </div>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Enter phone number" />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Location Details</h3>
                <div className="form-group">
                  <label>Full Address</label>
                  <textarea rows="2" name="address" value={formData.address} onChange={handleChange} placeholder="Enter street address..."></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Enter state" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Country</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Enter country" />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Enter pincode" />
                  </div>
                </div>
              </div>

              <div className="form-actions sticky-actions">
                <button type="submit" className="save-btn">
                  {editingUser ? "Update User" : "Save User"}
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

export default User;
