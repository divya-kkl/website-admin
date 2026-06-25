import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import Sidebar from './Sidebar';
import './DashboardHome.css';

function DashboardHome() {
  const [profileOpen, setProfileOpen] = useState(false);
  const email = localStorage.getItem('email');

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Admin</h1>
        
        <div className="profile-container">
          <FaUserCircle 
            size={32} 
            className="profile-icon"
            onClick={() => setProfileOpen(!profileOpen)} 
          />
          
          {profileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-info">
                <strong className="dropdown-label">Logged in as:</strong>
                {email || 'admin@example.com'}
              </div>
              <button 
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      
      <Outlet />
    </div>
    </div>
  );
}

export default DashboardHome;
