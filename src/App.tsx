import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import LoginPage from "./components/login/LoginPage";
import HomePage from "./components/home/HomePage";
import PasswordReset from "./components/login/PasswordReset";

function App() {
  return (
    <AnimatePresence mode="wait">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/password-reset" element={<PasswordReset />} />
        </Routes>
      </Router>
    </AnimatePresence>
  );
}

export default App;