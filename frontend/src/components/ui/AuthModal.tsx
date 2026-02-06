import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Mail, Lock } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

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

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    title?: string;
    description?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title = "Đăng nhập để tiếp tục 📚",
    description = "Bạn cần đăng nhập để thêm sách vào giỏ mượn."
}) => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

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
            toast.success('Đăng nhập thành công!');
            onSuccess?.();
            onClose();
        } catch (error) {
            // Error is handled in the auth context
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = () => {
        onClose();
        navigate('/register');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="md"
        >
            <div className="space-y-6">
                {/* Description */}
                <div className="text-center">
                    <div className="text-4xl mb-4">🔐</div>
                    <p className="text-dark-300">
                        {description}
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="Nhập email của bạn"
                        icon={<Mail className="w-4 h-4" />}
                        error={errors.email?.message}
                        {...register('email')}
                    />

                    <Input
                        label="Mật khẩu"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        icon={<Lock className="w-4 h-4" />}
                        error={errors.password?.message}
                        {...register('password')}
                    />

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
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-dark-800 text-dark-400">Hoặc</span>
                    </div>
                </div>

                {/* Register Link */}
                <div className="text-center">
                    <p className="text-dark-300 mb-4">
                        Chưa có tài khoản?
                    </p>
                    <Button
                        variant="secondary"
                        onClick={handleRegister}
                        className="w-full"
                    >
                        <User className="w-4 h-4 mr-2" />
                        Tạo tài khoản mới
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AuthModal;
