import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Add this
import LoginPage from "./components/login/LoginPage";
import HomePage from "./components/home/home";
import PasswordReset from "./components/login/PasswordReset";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/password-reset" element={<PasswordReset />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;