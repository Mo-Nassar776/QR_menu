
# Smart QR Menu System - Architecture & Business Plan

## 1. System Architecture
This system follows a **Decoupled Client-Server Architecture** designed for portability and speed.

- **Client (Frontend)**:
  - A lightweight **Vanilla JS** Single Page Application (SPA).
  - No build step required (runs directly in browser).
  - Fetches configuration and content from the backend API.
  - Caches assets aggressively for performance.

- **Server (Backend)**:
  - **Node.js + Express**: Handles API requests and serves static files.
  - **JSON Storage**: Data is stored in local JSON files (`menu.json`, `restaurant.json`). This ensures:
    - Zero external database dependencies (no Mongo/MySQL setup needed).
    - Easy backup (copy-paste the `data` folder).
    - Extremely fast reads.

## 2. Project Structure
```
/qr-menu-system
├── /backend
│   ├── /data
│   │   ├── menu.json         # Categories & Items
│   │   └── restaurant.json   # Branding, Socials, Config
│   ├── server.js             # Main Express App
│   └── package.json
├── /frontend
│   ├── /assets
│   │   └── /images
│   ├── /css
│   │   └── style.css         # Premium UI Styles
│   ├── /js
│   │   └── app.js            # Core Logic
│   └── index.html            # Entry Point
└── /docs                     # Documentation
```

## 3. Monetization Strategy
**Model: "Menu-as-a-Service" (MaaS)**
1.  **Setup Fee ($150 - $300)**:
    - Configuring their branding (Logo/Colors).
    - Digitizing their paper menu (typing data).
    - QR Code generation & sticker design.
2.  **Monthly Subscription ($20 - $50)**:
    - Hosting.
    - "Unlimited" menu updates (they text you, you update).
    - Phase 2: Self-service admin panel access.

## 4. Sales Pitch (For Restaurant Owners)
*"Stop printing disposable menus that fade and tear. Give your customers a premium digital experience that sells more food. Our Smart QR Menu sits on their phone, looks sleek, and lets you update prices instantly without re-printing. It’s faster, cleaner, and connects them directly to your WhatsApp for orders. Let’s get you live by this weekend."*

## 5. UI/UX Decisions (Premium & Localized)
- **Palette**: `Slate-900` (Dark Mode luxury) coupled with `Gold/Amber` accents. Appetizing and professional.
- **Interactivity**: Smooth "Spring" animations when opening categories.
- **Typography**: Modern Sans-Serif (Google Fonts: 'Outfit') - legible, works well for English numbers even with Arabic text.
- **Navigation**: Sticky "Category Pills" at the top for quick access (crucial for long menus).
