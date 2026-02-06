import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon, User, LogOut, BookOpen, ShoppingCart, BarChart3, Heart, Bell, Home, Calendar, DollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import Button from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { isDark, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
      if (isMenuOpen && !(event.target as Element).closest('.mobile-menu')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isMenuOpen]);


  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const navItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Sách', href: '/catalog', icon: BookOpen },
    { name: 'Thể loại', href: '/categories', icon: BookOpen },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-sm border-b transition-all duration-300 ${isScrolled
        ? 'bg-white/5 border-white/10 shadow-lg'
        : 'bg-transparent border-white/5'
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <BookOpen className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl gradient-text">
                Thư Viện
              </span>
              <span className="text-xs text-dark-400 -mt-1">
                Digital Library
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-dark-300 hover:text-primary-400 hover:bg-white/5 transition-all duration-200 font-medium group"
              >
                <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {item.name}
              </Link>
            ))}
          </nav>


          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            {isAuthenticated && <NotificationBell />}

            {/* Favorites Button */}
            {isAuthenticated && (
              <Link
                to="/favorites"
                className="relative p-2 rounded-xl hover:bg-white/10 transition-colors duration-200 group"
                title="Sách yêu thích"
              >
                <Heart className="w-5 h-5 text-dark-300 group-hover:text-red-400 transition-colors" />
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors duration-200 group"
              title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-dark-300 group-hover:text-yellow-400 transition-colors" />
              ) : (
                <Moon className="w-5 h-5 text-dark-300 group-hover:text-blue-400 transition-colors" />
              )}
            </button>

            {/* Cart Button */}
            {isAuthenticated && (
              <Link
                to="/cart"
                className="relative p-2 rounded-xl hover:bg-white/10 transition-colors duration-200 group"
                title="Giỏ mượn sách"
              >
                <ShoppingCart className="w-5 h-5 text-dark-300 group-hover:text-primary-400 transition-colors" />
                {totalItems > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative user-menu">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-colors duration-200 group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:2409'}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}`}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <User className={`w-4 h-4 text-white ${user?.avatarUrl ? 'hidden' : ''}`} />
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="text-dark-300 font-medium block">
                      {user?.fullName}
                    </span>
                    <span className="text-xs text-dark-400">
                      {user?.role === 'ADMIN' ? 'Quản trị viên' :
                        user?.role === 'LIBRARIAN' ? 'Thủ thư' : 'Độc giả'}
                    </span>
                  </div>
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-56 bg-dark-800/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl overflow-hidden"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="py-2">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-dark-50">{user?.fullName}</p>
                              <p className="text-sm text-dark-400">{user?.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            to="/profile"
                            className="flex items-center px-4 py-3 text-dark-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-200 group"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4 mr-3 group-hover:text-primary-400 transition-colors" />
                            Hồ sơ cá nhân
                          </Link>

                          {/* Admin/Librarian specific menu */}
                          {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN') ? (
                            <>
                              <Link
                                to="/loan-management"
                                className="flex items-center px-4 py-3 text-dark-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-200 group"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <BookOpen className="w-4 h-4 mr-3 group-hover:text-primary-400 transition-colors" />
                                Quản lý mượn sách
                              </Link>
                              <Link
                                to="/dashboard"
                                className="flex items-center px-4 py-3 text-dark-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-200 group"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <BarChart3 className="w-4 h-4 mr-3 group-hover:text-primary-400 transition-colors" />
                                Dashboard
                              </Link>
                            </>
                          ) : (
                            /* Regular user menu */
                            <>
                              <Link
                                to="/my-loans"
                                className="flex items-center px-4 py-3 text-dark-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-200 group"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <BookOpen className="w-4 h-4 mr-3 group-hover:text-primary-400 transition-colors" />
                                Sách đã mượn
                              </Link>
                              <Link
                                to="/my-fines"
                                className="flex items-center px-4 py-3 text-dark-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-200 group"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <DollarSign className="w-4 h-4 mr-3 group-hover:text-primary-400 transition-colors" />
                                Phạt vi phạm
                              </Link>
                              <Link
                                to="/favorites"
                                className="flex items-center px-4 py-3 text-dark-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-200 group"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Heart className="w-4 h-4 mr-3 group-hover:text-red-400 transition-colors" />
                                Sách yêu thích
                              </Link>
                              <Link
                                to="/notifications"
                                className="flex items-center px-4 py-3 text-dark-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-200 group"
                                onClick={() => setIsUserMenuOpen(false)}
                              >
                                <Bell className="w-4 h-4 mr-3 group-hover:text-primary-400 transition-colors" />
                                Thông báo
                              </Link>
                            </>
                          )}
                        </div>

                        <hr className="my-2 border-white/10" />

                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 transition-all duration-200 group"
                        >
                          <LogOut className="w-4 h-4 mr-3 group-hover:text-red-300 transition-colors" />
                          Đăng xuất
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="px-4 py-2">
                    Đăng nhập
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="px-4 py-2">
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors duration-200 group"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-dark-300 group-hover:text-primary-400 transition-colors" />
              ) : (
                <Menu className="w-5 h-5 text-dark-300 group-hover:text-primary-400 transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="py-4 border-t border-white/10 bg-gradient-to-br from-dark-800/50 to-dark-900/50 backdrop-blur-sm">
                <div className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center gap-3 px-4 py-3 text-dark-300 hover:text-primary-400 hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10 rounded-lg transition-all duration-200 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      {item.name}
                    </Link>
                  ))}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
