import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaTags, FaBoxOpen, FaShoppingCart, FaUsers, FaImages, FaCaretDown, FaCaretUp, FaTruck } from 'react-icons/fa';
import './Sidebar.css';

function Sidebar() {
  const [bannersOpen, setBannersOpen] = React.useState(false);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Admin Panel</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FaHome className="nav-icon" /> Dashboard
        </NavLink>
        <NavLink to="/dashboard/orders" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FaShoppingCart className="nav-icon" /> Orders
        </NavLink>
        <NavLink to="/dashboard/categories" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FaTags className="nav-icon" /> Categories
        </NavLink>
        <NavLink to="/dashboard/products" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FaBoxOpen className="nav-icon" /> Products
        </NavLink>
        <NavLink to="/dashboard/carts" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FaShoppingCart className="nav-icon" /> Carts
        </NavLink>
        <NavLink to="/dashboard/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FaUsers className="nav-icon" /> Users
        </NavLink>
        <NavLink to="/dashboard/shopusers" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FaUsers className="nav-icon" /> Shop Users
        </NavLink>
        <NavLink to="/dashboard/top-banners" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FaImages className="nav-icon" /> Top Banners
        </NavLink>
        <NavLink to="/dashboard/delivery-charger" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FaTruck className="nav-icon" /> Delivery Charger
        </NavLink>
        
        <div className="nav-group">
          <div className="nav-link" onClick={() => setBannersOpen(!bannersOpen)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <FaImages className="nav-icon" /> Banners
            </div>
            {bannersOpen ? <FaCaretUp /> : <FaCaretDown />}
          </div>
          {bannersOpen && (
            <div className="submenu" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
              <NavLink to="/dashboard/banners/first" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} style={{ fontSize: '14px', padding: '8px 15px' }}>
                First Banner
              </NavLink>
              <NavLink to="/dashboard/banners/second" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} style={{ fontSize: '14px', padding: '8px 15px' }}>
                Second Banner
              </NavLink>
              <NavLink to="/dashboard/banners/third" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} style={{ fontSize: '14px', padding: '8px 15px' }}>
                Third Banner
              </NavLink>
              <NavLink to="/dashboard/top-banners" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} style={{ fontSize: '14px', padding: '8px 15px' }}>
                Top Banners
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
