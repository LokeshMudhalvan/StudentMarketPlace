import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Registration from './pages/registration';
import './App.css'

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
        </Routes>
      </Router>
    </div>
  )
}

export default App
