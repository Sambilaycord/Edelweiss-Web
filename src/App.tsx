import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import LoginPage from "./components/login/LoginPage";
import HomePage from "./components/home/HomePage";
import ProfilePage from "./components/profile/ProfilePage";


function App() {
  return (
    <AnimatePresence mode="wait">
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Router>
    </AnimatePresence>
  );
}

export default App;
