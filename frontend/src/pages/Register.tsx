import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const schema = yup.object({
    fullName: yup
        .string()
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .required('Họ tên là bắt buộc'),
    email: yup
        .string()
        .email('Email không hợp lệ')
        .required('Email là bắt buộc'),
    password: yup
        .string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
        )
        .required('Mật khẩu là bắt buộc'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
        .required('Xác nhận mật khẩu là bắt buộc'),
});

type FormData = yup.InferType<typeof schema>;

const Register: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register: registerUser } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormData>({
        resolver: yupResolver(schema),
    });

    const password = watch('password', '');

    const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(password);

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            await registerUser(data.fullName, data.email, data.password);
            navigate('/');
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
                {/* Register Card */}
                <div className="glass-card p-8 shadow-glass-lg">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-heading font-bold text-dark-50 mb-2">
                            Tạo tài khoản mới 🎉
                        </h1>
                        <p className="text-dark-300">
                            Tham gia cộng đồng thư viện ngay hôm nay
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Input
                            label="Họ và tên"
                            type="text"
                            placeholder="Nhập họ tên đầy đủ"
                            icon={<User className="w-4 h-4" />}
                            error={errors.fullName?.message}
                            {...register('fullName')}
                        />

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
                                placeholder="Tạo mật khẩu mạnh"
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

                        {/* Password Strength Indicator */}
                        {password && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-dark-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength <= 2
                                                ? 'bg-red-500'
                                                : passwordStrength <= 3
                                                    ? 'bg-yellow-500'
                                                    : 'bg-green-500'
                                                }`}
                                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-dark-400">
                                        {passwordStrength <= 2 ? 'Yếu' : passwordStrength <= 3 ? 'Trung bình' : 'Mạnh'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-xs text-dark-400">
                                    <div className={`flex items-center gap-1 ${password.length >= 6 ? 'text-green-400' : ''}`}>
                                        <Check className="w-3 h-3" />
                                        Ít nhất 6 ký tự
                                    </div>
                                    <div className={`flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-green-400' : ''}`}>
                                        <Check className="w-3 h-3" />
                                        Chữ thường
                                    </div>
                                    <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-400' : ''}`}>
                                        <Check className="w-3 h-3" />
                                        Chữ hoa
                                    </div>
                                    <div className={`flex items-center gap-1 ${/\d/.test(password) ? 'text-green-400' : ''}`}>
                                        <Check className="w-3 h-3" />
                                        Số
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <Input
                                label="Xác nhận mật khẩu"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Nhập lại mật khẩu"
                                icon={<Lock className="w-4 h-4" />}
                                error={errors.confirmPassword?.message}
                                {...register('confirmPassword')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-9 text-dark-400 hover:text-dark-300 transition-colors"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="terms"
                                className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2 mt-1"
                                required
                            />
                            <label htmlFor="terms" className="text-sm text-dark-300">
                                Tôi đồng ý với{' '}
                                <Link to="/terms" className="text-primary-400 hover:text-primary-300">
                                    Điều khoản sử dụng
                                </Link>{' '}
                                và{' '}
                                <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
                                    Chính sách bảo mật
                                </Link>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            Tạo tài khoản
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

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-dark-300">
                            Đã có tài khoản?{' '}
                            <Link
                                to="/login"
                                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                            >
                                Đăng nhập ngay
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

export default Register;
