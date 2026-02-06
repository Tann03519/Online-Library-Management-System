import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Categories from './pages/Categories';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import MyLoans from './pages/MyLoans';
import Favorites from './pages/Favorites';
import LoanManagement from './pages/LoanManagement';
import MyFines from './pages/MyFines';
import Dashboard from './pages/Dashboard';
import BookManagement from './pages/BookManagement';
import UserManagement from './pages/UserManagement';
import ReviewManagement from './pages/ReviewManagement';
import Notifications from './pages/Notifications';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <div className="min-h-screen bg-dark-900 text-dark-50">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/book/:id" element={<BookDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/my-loans" element={<MyLoans />} />
                    <Route path="/my-fines" element={<MyFines />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/loan-management" element={<LoanManagement />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/book-management" element={<BookManagement />} />
                    <Route path="/user-management" element={<UserManagement />} />
                    <Route path="/review-management" element={<ReviewManagement />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'rgba(15, 23, 42, 0.9)',
                      color: '#f8fafc',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(16px)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#14b8a6',
                        secondary: '#f8fafc',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#f8fafc',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
