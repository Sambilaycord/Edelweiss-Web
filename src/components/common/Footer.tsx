import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* About Us */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-white font-serif tracking-wide">Edelweiss</h3>
          <p className="text-sm leading-relaxed text-gray-400">
            Edelweiss is an e-commerce platform designed to unify the floral gifting experience across Northern Mindanao. We bring local flower shops right to your fingertips, offering seamless browsing, transparent pricing, and customizable arrangements.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Quick Links</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/" className="hover:text-pink-400 transition-colors">Home</a></li>
            <li><a href="/shop" className="hover:text-pink-400 transition-colors">Shop</a></li>
            <li><a href="/profile" className="hover:text-pink-400 transition-colors">My Profile</a></li>
            <li><a href="/become-a-seller" className="hover:text-pink-400 transition-colors">Become a Seller</a></li>
          </ul>
        </div>

        {/* Contact Us */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Contact Us</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-3">
              <MapPin size={18} className="text-pink-500" />
              <span>Northern Mindanao, Philippines</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-pink-500" />
              <span>+63 912 345 6789</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-pink-500" />
              <span>support@edelweiss.com</span>
            </li>
          </ul>
          
          <div className="flex items-center gap-4 pt-4">
            <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-pink-600 hover:text-white transition-all">
              <Facebook size={18} />
            </a>
            <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-pink-600 hover:text-white transition-all">
              <Instagram size={18} />
            </a>
            <a href="#" className="p-2 bg-gray-800 rounded-full hover:bg-pink-600 hover:text-white transition-all">
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Edelweiss. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
