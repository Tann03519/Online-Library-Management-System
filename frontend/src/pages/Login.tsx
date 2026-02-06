import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, BookOpen, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const schema = yup.object({
    email: yup
        .string()
        .email('Email không hợp lệ')
        .required('Email là bắt buộc'),
    password: yup
        .string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .required('Mật khẩu là bắt buộc'),
});

type FormData = yup.InferType<typeof schema>;

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            await login(data.email, data.password);
            navigate(from, { replace: true });
        } catch (error) {
            // Error is handled in the auth context
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.2, 0.8, 0.2],
                        }}
                        transition={{
                            duration: 4 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            <motion.div
                className="relative w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Login Card */}
                <div className="glass-card p-8 shadow-glass-lg">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-heading font-bold text-dark-50 mb-2">
                            Chào mừng trở lại 📚
                        </h1>
                        <p className="text-dark-300">
                            Đăng nhập để tiếp tục khám phá thư viện
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="Nhập email của bạn"
                            icon={<Mail className="w-4 h-4" />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <div className="relative">
                            <Input
                                label="Mật khẩu"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                icon={<Lock className="w-4 h-4" />}
                                error={errors.password?.message}
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-dark-400 hover:text-dark-300 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                                />
                                <span className="ml-2 text-sm text-dark-300">
                                    Ghi nhớ đăng nhập
                                </span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            Đăng nhập
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-dark-800 text-dark-400">Hoặc</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-dark-300">
                            Chưa có tài khoản?{' '}
                            <Link
                                to="/register"
                                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                            >
                                Đăng ký ngay
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link
                        to="/"
                        className="text-dark-300 hover:text-white transition-colors text-sm"
                    >
                        ← Quay lại trang chủ
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
