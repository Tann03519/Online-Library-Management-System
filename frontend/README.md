# Thư Viện - Modern Library Management Frontend

A modern, responsive library management system built with React, TypeScript, and Tailwind CSS. Features a Netflix-style browsing experience with glassmorphism design and smooth animations.

## 🎨 Design Features

- **Dark-first Design**: Modern dark theme with glassmorphism effects
- **Netflix-style Browsing**: Horizontal carousels and poster-style book cards
- **Glassmorphism UI**: Backdrop blur effects and translucent surfaces
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Modern Typography**: Poppins for headings, Inter for body text

## 🚀 Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** with Yup validation
- **Lucide React** for icons
- **Axios** for API calls

## 🎯 Key Features

### Public Features (No Login Required)
- Browse books by categories, publishers, faculties
- Search books by title, author, ISBN
- View book details and availability
- Modern carousel-based book discovery
- Responsive grid and list views

### User Features (Login Required)
- User registration and authentication
- Shopping cart for book loans
- Personal loan history
- Profile management
- Theme switching (dark/light)

### UI/UX Highlights
- **Hero Section**: Gradient background with animated particles
- **Book Cards**: Hover effects with overlay actions
- **Search**: Real-time search with filters
- **Navigation**: Floating header with glassmorphism
- **Forms**: Modern input fields with validation
- **Loading States**: Skeleton loaders and spinners
- **Empty States**: Engaging illustrations and CTAs

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables:
```env
REACT_APP_API_URL=http://localhost:2409/api
REACT_APP_APP_NAME=Thư Viện
REACT_APP_VERSION=1.0.0
```

4. Start development server:
```bash
npm start
```

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/          # Header, Footer, Layout
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts (Auth, Theme, Cart)
├── lib/               # API client and utilities
├── pages/             # Page components
├── types/             # TypeScript type definitions
└── App.tsx           # Main app component
```

## 🎨 Design System

### Colors
- **Primary**: Teal gradient (#14B8A6 → #0D9488)
- **Accent**: Gold gradient (#F59E0B → #FBBF24)
- **Background**: Dark slate (#0F172A)
- **Surface**: Glass with blur (rgba(255,255,255,0.05))

### Typography
- **Headings**: Poppins (SemiBold)
- **Body**: Inter (Regular)
- **Code**: Roboto Mono

### Components
- **Buttons**: Primary, Secondary, Accent variants
- **Cards**: Glass effect with hover animations
- **Forms**: Modern inputs with validation
- **Modals**: Backdrop blur with smooth transitions

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🌟 Key Components

### BookCard
- Poster-style book display
- Hover effects with action buttons
- Availability indicators
- Status badges (New, Hot, Out of Stock)

### Header
- Floating glassmorphism design
- Search bar with real-time suggestions
- User menu with avatar
- Theme toggle
- Shopping cart indicator

### Catalog
- Advanced filtering system
- Grid and list view modes
- Infinite scroll pagination
- Quick filter chips
- Responsive sidebar

## 🎭 Animations

- **Page Transitions**: Smooth fade and slide effects
- **Card Hover**: Scale and glow effects
- **Loading States**: Shimmer and pulse animations
- **Form Interactions**: Focus and validation feedback
- **Navigation**: Smooth scroll and page changes

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔗 API Integration

The frontend connects to the backend API with:
- Automatic token refresh
- Error handling with user feedback
- Loading states for all operations
- Optimistic updates where appropriate

## 🎯 Future Enhancements

- [ ] Book detail pages
- [ ] User dashboard
- [ ] Admin panel
- [ ] Advanced search filters
- [ ] Book recommendations
- [ ] Reading lists
- [ ] Social features
- [ ] Mobile app (React Native)

## 📄 License

MIT License - see LICENSE file for details.