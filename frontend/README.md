# Do4U - Service Marketplace Platform 🚀

A modern, professional service marketplace application built with React, Vite, Tailwind CSS, and Firebase.

## 🌟 Features

### Multi-Role System

- **Users**: Post jobs, manage requests, and hire service providers
- **Genies**: Browse available jobs, make offers, and provide services
- **Admins**: Verify service providers and manage complaints

### Core Functionality

- ✨ **Job Management**: Create, browse, and manage service requests
- 💰 **Wallet System**: Add funds, view transactions, and manage payments
- 🤝 **Bargaining System**: Negotiate prices with offers and counter-offers
- ⭐ **Rating System**: Rate services and build reputation
- 🛡️ **Complaint System**: File and manage complaints
- 🔐 **Authentication**: Secure Firebase-based authentication
- 📱 **Responsive Design**: Mobile-first, works on all devices

## 🎨 Professional UI Features

- **Glassmorphism Effects**: Modern glass-like components with blur effects
- **Smooth Animations**: Slide, fade, and hover animations throughout
- **Gradient Designs**: Beautiful color gradients for primary actions
- **Custom Scrollbars**: Styled scrollbars matching the theme
- **Loading States**: Professional loading spinners with glow effects
- **Modal Dialogs**: Smooth modal transitions
- **Card Layouts**: Clean, elevated card designs
- **Status Indicators**: Color-coded status badges

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── common/          # Reusable components (Button, Modal, Loader)
│   │   ├── auth/            # Login & Signup
│   │   ├── jobs/            # Job-related components
│   │   ├── bargaining/      # Offer management
│   │   ├── wallet/          # Wallet management
│   │   ├── rating/          # Rating system
│   │   ├── complaint/       # Complaint filing
│   │   └── admin/           # Admin components
│   ├── pages/               # Main page components
│   ├── services/            # API and Firebase services
│   ├── context/             # React Context providers
│   ├── routes/              # Protected route components
│   ├── utils/               # Helper functions
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── tailwind.config.js
├── vite.config.js
├── package.json
└── .env
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account (for authentication)

### Installation

1. **Clone the repository**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password)
   - Copy your Firebase config
   - Update `.env` file with your Firebase credentials:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage

### For Users

1. Sign up as a "User"
2. Post jobs with details, budget, and deadline
3. Review offers from Genies
4. Accept offers and track job progress
5. Rate and review completed services

### For Genies (Service Providers)

1. Sign up as a "Genie"
2. Browse available jobs
3. Make offers on jobs
4. Complete assigned tasks
5. Build your reputation through ratings

### For Admins

1. Access admin dashboard
2. Verify Genie applications
3. Manage complaints
4. Monitor platform activity

## 🎨 Design System

### Colors

- **Primary**: Blue gradient (#0ea5e9 → #0369a1)
- **Secondary**: Purple gradient (#d946ef → #a21caf)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)

### Typography

- Font Family: Inter (Google Fonts)
- Weights: 300, 400, 500, 600, 700, 800

### Components

All components follow a consistent design language with:

- Rounded corners (rounded-lg, rounded-xl)
- Soft shadows (shadow-soft)
- Smooth transitions (transition-all duration-300)
- Hover effects (scale, shadow-glow)

## 🛠️ Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Firebase**: Authentication and backend
- **Axios**: HTTP client
- **Lucide React**: Beautiful icon library

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 🔐 Environment Variables

Required environment variables in `.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🎭 Key Features Showcase

### Authentication

- Beautiful login/signup forms
- Email/password authentication
- Role selection (User/Genie)
- Protected routes
- Persistent sessions

### Dashboard

- Role-specific dashboards
- Statistics cards
- Search and filtering
- Real-time updates
- Quick actions

### Job Management

- Job posting form
- Job cards grid
- Detailed job view
- Status tracking
- Category filtering

### Wallet

- Balance display
- Transaction history
- Add funds modal
- Quick amount presets
- Visual transaction indicators

### Offers & Bargaining

- Make offers on jobs
- View all offers
- Accept/reject offers
- Negotiation messaging
- Real-time status updates

### Ratings & Reviews

- 5-star rating system
- Written reviews
- Hover animations
- Rating submission

### Admin Panel

- Genie verification queue
- Complaint management
- Status updates
- Detailed views

## 🤝 Contributing

This is a frontend-only implementation. To integrate with a backend:

1. Update API endpoints in `src/services/api.js`
2. Configure your backend URL in `.env`
3. Ensure API responses match expected data structures
4. Add error handling as needed

## 📝 Notes

- This is a frontend-only implementation
- All API calls are configured but require a backend
- Firebase authentication is ready to use
- Sample data structures are included in components
- All components are fully responsive

## 🎨 UI Preview

The application features:

- 🎭 Glassmorphism design
- 🌈 Vibrant gradient colors
- ✨ Smooth animations
- 📱 Mobile-responsive layout
- 🎯 Intuitive navigation
- 💎 Premium feel

## 📄 License

This project is part of Team-13's CSI Project Expo submission.

## 🙏 Acknowledgments

- Design inspiration from modern SaaS applications
- Icons by Lucide React
- Typography by Google Fonts (Inter)
- Built with ❤️ for CSI Project Expo

---

**Built by Team-13** | CSI Project Expo 2026
