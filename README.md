# 🌸 Edelweiss Web

**Edelweiss** is a conceptual e-commerce project designed to envision a unified marketplace connecting flower shops and customers across Northern Mindanao. This project aims to explore how we can transform the traditional flower shopping experience by proposing a seamless, transparent, and highly customizable platform for floral gifting.

## 📖 Project Background

Buying flowers traditionally often involves inconvenient trips to physical stores, inconsistent freshness, limited customization options, and unclear pricing across different local florists. 

The Edelweiss project was conceptualized to solve these problems by designing a unified digital marketplace. The core idea is that whether it's for a corporate event or a personal milestone, users could easily browse, compare real-time prices, and personalize their floral arrangements without leaving their homes. Our goal with this project is to build a fully functional prototype that makes floral gifting as seamless and tailored as possible.

## 💻 Tech Stack (Prototype)
- **Frontend**: React 19, TypeScript, Vite
- **Styling & UI**: Tailwind CSS 4, Framer Motion, Lucide React
- **Backend**: Supabase

## ✨ Features Currently Implemented
As we build out this concept, the following features have been successfully developed in our prototype:
- **Dynamic Storefront**: A responsive home page featuring promotional carousels (Flash Sales, Launch Month specials) and an intuitive category grid.
- **Seamless Product Browsing**: A user interface designed to navigate through curated catalogs of floral arrangements from simulated local shops.
- **Persistent Wishlist**: A working favorites system (via an interactive heart icon) securely stored using Supabase.
- **Shopping Cart & Checkout Flow**: A functional cart management and mock checkout experience.
- **Gift Reminder System**: A prototype dual-path reminder system equipped with gift-linking logic to help users remember significant events.
- **User Profiles**: Basic account management for personal information and preferences.

## 🚀 Features Currently Being Worked On
As the project evolves, we are actively developing the following concepts:
- **Order Personalization Mechanics**: Building interfaces that allow customers to deeply customize bouquets, add tailored messages, and select specific add-ons.
- **Simulated Real-Time Tracking**: Developing a UI flow to demonstrate how users would track their order status from preparation to delivery.
- **Subscription Plan Workflows**: Creating the user experience for weekly fresh flower delivery subscriptions.
- **Vendor Dashboard Concept**: Designing tools that local flower shop owners would use to manage orders efficiently and update bouquet prices.
- **Enhanced Promotional UI**: Refining visual assets and layout responsiveness to make the storefront feel truly premium.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository
   ```sh
   git clone https://github.com/yourusername/Edelweiss-Web.git
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Set up environment variables
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server
   ```sh
   npm run dev
   ```
