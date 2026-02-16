import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Add this
import LoginPage from "./components/login/LoginPage";
import HomePage from "./components/home/home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Define your Login route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Define your Home route */}
        <Route path="/" element={<HomePage />} />

        {/* Optional: Redirect any unknown path to login */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;