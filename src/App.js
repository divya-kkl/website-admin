import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import DashboardHome from './DashboardHome';

import Orders from './pages/Orders/Orders';

import Categories from './components/ProductCategories/Categories';
import Product from './components/Product/Product';
import Cart from './components/Cart/Cart';
import User from './components/User/User';
import ShopUser from './components/ShopUser/ShopUser';
import Banner from './components/Banner/Banner';
import TopBanner from './components/TopBanner/TopBanner';
import DeliveryCharger from './components/DeliveryCharger/DeliveryCharger';
import FAQ from './components/FAQ/FAQ';

const PrivateRoute = ({ children }) => {
  // Check if token exists or user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const token = localStorage.getItem('jwtToken');
  return (isLoggedIn && token) ? children : <Navigate to="/" />;
};

function App() {
  return (
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardHome />
            </PrivateRoute>
          }
        >
          <Route index element={
            <main className="dashboard-main">
              <h2 className="welcome-title">Welcome to the Admin Dashboard</h2>
              <p className="welcome-text">This is your main control panel. Select an option from the sidebar to continue.</p>
            </main>
          } />
          <Route path="orders" element={<main className="dashboard-main"><Orders /></main>} />
          <Route path="categories" element={<main className="dashboard-main"><Categories /></main>} />
          <Route path="products" element={<main className="dashboard-main"><Product /></main>} />
          <Route path="carts" element={<main className="dashboard-main"><Cart /></main>} />
          <Route path="users" element={<main className="dashboard-main"><User /></main>} />
          <Route path="shopusers" element={<main className="dashboard-main"><ShopUser /></main>} />
          <Route path="banners/first" element={<main className="dashboard-main"><Banner bannerType="FIRST" title="First Banner" /></main>} />
          <Route path="banners/second" element={<main className="dashboard-main"><Banner bannerType="SECOND" title="Second Banner" /></main>} />
          <Route path="banners/third" element={<main className="dashboard-main"><Banner bannerType="THIRD" title="Third Banner" /></main>} />
          <Route path="top-banners" element={<main className="dashboard-main"><TopBanner /></main>} />
          <Route path="delivery-charger" element={<main className="dashboard-main"><DeliveryCharger /></main>} />
          <Route path="faqs" element={<main className="dashboard-main"><FAQ /></main>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
