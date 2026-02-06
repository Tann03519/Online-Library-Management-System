import React from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-dark-900 pt-16 flex items-center justify-center">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* 404 Animation */}
                    <motion.div
                        className="relative mb-8"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="text-8xl sm:text-9xl font-bold text-primary-400 mb-4">
                            404
                        </div>
                        <motion.div
                            className="absolute -top-4 -right-4 w-16 h-16 bg-accent-500 rounded-full flex items-center justify-center"
                            animate={{
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                        >
                            <BookOpen className="w-8 h-8 text-white" />
                        </motion.div>
                    </motion.div>

                    <h1 className="text-3xl sm:text-4xl font-heading font-bold text-dark-50 mb-4">
                        Trang không tìm thấy
                    </h1>

                    <p className="text-dark-300 text-lg mb-8 leading-relaxed">
                        Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                        Hãy kiểm tra lại URL hoặc quay về trang chủ.
                    </p>

                    {/* Floating Books Animation */}
                    <div className="relative mb-12">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-8 h-8 bg-primary-500/20 rounded-lg"
                                style={{
                                    left: `${20 + i * 15}%`,
                                    top: `${Math.random() * 20}px`,
                                }}
                                animate={{
                                    y: [0, -20, 0],
                                    rotate: [0, 5, -5, 0],
                                    opacity: [0.3, 0.8, 0.3],
                                }}
                                transition={{
                                    duration: 3 + i * 0.5,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                }}
                            />
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => navigate(-1)}
                            variant="secondary"
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Button>

                        <Link to="/">
                            <Button className="flex items-center gap-2">
                                <Home className="w-4 h-4" />
                                Trang chủ
                            </Button>
                        </Link>

                        <Link to="/catalog">
                            <Button variant="accent" className="flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Tìm sách
                            </Button>
                        </Link>
                    </div>

                    {/* Helpful Links */}
                    <div className="mt-12 pt-8 border-t border-dark-700">
                        <p className="text-dark-400 mb-4">Có thể bạn đang tìm kiếm:</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link
                                to="/catalog"
                                className="text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                Danh mục sách
                            </Link>
                            <Link
                                to="/about"
                                className="text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                Giới thiệu
                            </Link>
                            <Link
                                to="/profile"
                                className="text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                Hồ sơ cá nhân
                            </Link>
                            <Link
                                to="/my-loans"
                                className="text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                Sách đã mượn
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFound;
