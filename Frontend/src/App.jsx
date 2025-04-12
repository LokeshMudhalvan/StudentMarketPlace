import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Registration from './pages/registration';
import Dashboard from './pages/dashboard';
import YourListings from './pages/yourListings';
import AddListing from './pages/addListing';
import EditListing from './pages/editListing';
import './App.scss'

function App() {

  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={
            <Login/>
          }/>

          <Route path="/register" element={
            <Registration/>
          }/>

          <Route path="/dashboard" element={
            <Dashboard/>
          }/>

          <Route path="/your-listings" element={
            <YourListings/>
          }/>

          <Route path="/add-listing" element={
            <AddListing/>
          }/>

          <Route path="/edit-listing/:listing_id" element={
            <EditListing/>
          }/>
        </Routes>
      </Router>
    </div>
  )
}

export default App
