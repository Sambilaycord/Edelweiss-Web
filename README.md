<img width="2559" height="757" alt="image" src="https://github.com/user-attachments/assets/ff5373b3-7068-40d1-b45b-6d14dab84efc" />


# 🌸 Edelweiss Web

**Edelweiss** is a conceptual e-commerce project designed to envision a unified marketplace connecting flower shops and customers across Northern Mindanao. This project aims to explore how the traditional flower shopping experience can be transformed by proposing a seamless, transparent, and highly customizable platform for floral gifting.

## 📖 Project Background

Buying flowers traditionally often involves inconvenient trips to physical stores, inconsistent freshness, limited customization options, and unclear pricing across different local florists. 

The Edelweiss project was conceptualized to solve these problems by designing a unified digital marketplace. The core idea is that whether it's for a corporate event or a personal milestone, users could easily browse, compare real-time prices, and personalize their floral arrangements without leaving their homes. The goal of this project is to build a fully functional prototype that makes floral gifting as seamless and tailored as possible.

## 💻 Tech Stack (Prototype)
- **Frontend**: React 19, TypeScript, Vite
- **Styling & UI**: Tailwind CSS 4, Framer Motion, Lucide React
- **Backend**: Supabase

## ✨ Features Currently Implemented

**<img width="2500" height="1376" alt="image" src="https://github.com/user-attachments/assets/01e5743c-e284-4cb6-bdd7-38912a6041d4" />**

> [!WARNING]
> **Disclaimer:** This project is currently in active development. Features and database schemas are being actively updated/changed.
> 
> **Asset Disclaimer:** The image assets used in this repository are not my own and serve strictly as placeholders for demonstration purposes. Some pictures include AI-generated content. This does not affect the overall functionality or code of the project.

As this concept is built out, the following features have been successfully developed in the prototype:
- **Authentication System**: Secure login and sign-up flows using email authentication.
- **Vendor Dashboard & User Profile Integration**: A seamless transition between a comprehensive seller dashboard and the standard user profile, allowing users to manage both personal information and storefront data smoothly.
- **Dynamic Storefront**: A responsive home page featuring promotional carousels (Flash Sales, Launch Month specials) and an intuitive category grid.
- **Seamless Product Browsing**: A user interface designed to navigate through curated catalogs of floral arrangements from simulated local shops.
- **Persistent Wishlist**: A working favorites system (via an interactive heart icon) securely stored using Supabase.
- **Shopping Cart & Checkout Flow**: A functional cart management and mock checkout experience.
- **Gift Reminder System**: A prototype dual-path reminder system equipped with gift-linking logic to help users remember significant events.

## 🛠️ Getting Started

<img width="2494" height="1375" alt="image" src="https://github.com/user-attachments/assets/208f0a84-8314-43cc-b4d8-b9d9302c2829" />

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
