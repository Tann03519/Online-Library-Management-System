import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Mail,
    Calendar,
    BookOpen,
    Settings,
    Save,
    Edit3,
    Check,
    X,
    Lock,
    Bell,
    Eye,
    EyeOff,
    Upload,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });


    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    // Avatar upload states
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);



    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
            });
            // Handle avatar URL - if it's a relative path, prepend the API base URL
            const avatarUrl = user.avatarUrl;
            if (avatarUrl) {
                if (avatarUrl.startsWith('http')) {
                    setAvatarPreview(avatarUrl);
                } else {
                    // Relative path from backend
                    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:2409';
                    const fullUrl = `${baseUrl}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
                    setAvatarPreview(fullUrl);
                }
            } else {
                setAvatarPreview('');
            }
        }
    }, [user]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updatedUser = await apiClient.updateProfile({
                fullName: formData.fullName,
            });

            updateUser(updatedUser.user);
            toast.success('Cập nhật hồ sơ thành công!');
            setIsEditing(false);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            fullName: user?.fullName || '',
            email: user?.email || '',
        });
        setIsEditing(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Password change handlers
    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword,
                passwordData.confirmPassword
            );
            toast.success('Đổi mật khẩu thành công!');
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
        } finally {
            setIsLoading(false);
        }
    };



    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Avatar upload handlers
    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file ảnh hợp lệ');
                return;
            }

            // Validate file size (max 2MB for avatar)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Kích thước file không được vượt quá 2MB');
                return;
            }

            setSelectedAvatarFile(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarUpload = async () => {
        if (!selectedAvatarFile) {
            toast.error('Vui lòng chọn ảnh trước khi upload');
            return;
        }

        setIsUploadingAvatar(true);
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('avatar', selectedAvatarFile);

            const updatedUser = await apiClient.uploadAvatar(formData);
            updateUser(updatedUser.user);
            setSelectedAvatarFile(null);
            toast.success('Cập nhật ảnh đại diện thành công!');
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi upload ảnh');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleAvatarRemove = () => {
        setSelectedAvatarFile(null);
        // Reset to original user avatar
        if (user?.avatarUrl) {
            if (user.avatarUrl.startsWith('http')) {
                setAvatarPreview(user.avatarUrl);
            } else {
                const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:2409';
                setAvatarPreview(`${baseUrl}${user.avatarUrl.startsWith('/') ? '' : '/'}${user.avatarUrl}`);
            }
        } else {
            setAvatarPreview('');
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-dark-900 pt-16 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔐</div>
                    <h2 className="text-2xl font-heading font-bold text-dark-300 mb-4">
                        Cần đăng nhập
                    </h2>
                    <p className="text-dark-400 mb-8">
                        Bạn cần đăng nhập để xem hồ sơ cá nhân.
                    </p>
                    <Button onClick={() => navigate('/login')}>
                        Đăng nhập
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 pt-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-bold text-dark-50 mb-2">
                        Hồ sơ cá nhân
                    </h1>
                    <p className="text-dark-300">
                        Quản lý thông tin cá nhân và cài đặt tài khoản
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="glass-card p-6 text-center">
                            {/* Avatar */}
                            <div className="relative inline-block mb-6">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={user.fullName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error('Avatar image failed to load:', avatarPreview);
                                                // Fallback to default avatar if image fails to load
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={`w-full h-full flex items-center justify-center ${avatarPreview ? 'hidden' : ''}`}>
                                        <User className="w-12 h-12 text-white" />
                                    </div>
                                </div>

                                {/* Upload overlay */}
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarSelect}
                                        className="hidden"
                                        id="avatar-upload"
                                    />
                                    <label
                                        htmlFor="avatar-upload"
                                        className="cursor-pointer p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                        title="Thay đổi ảnh đại diện"
                                    >
                                        <Upload className="w-4 h-4 text-white" />
                                    </label>
                                </div>
                            </div>

                            {/* Avatar Upload Controls */}
                            {selectedAvatarFile && (
                                <div className="mb-4 p-3 bg-dark-800 rounded-lg border border-primary-500/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full overflow-hidden">
                                                <img
                                                    src={avatarPreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm text-dark-300 font-medium">
                                                    {selectedAvatarFile.name}
                                                </p>
                                                <p className="text-xs text-dark-400">
                                                    {(selectedAvatarFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleAvatarRemove}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={handleAvatarUpload}
                                                isLoading={isUploadingAvatar}
                                                disabled={isUploadingAvatar}
                                            >
                                                {isUploadingAvatar ? 'Đang upload...' : 'Cập nhật'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* User Info */}
                            <h2 className="text-xl font-heading font-bold text-dark-50 mb-2">
                                {user.fullName}
                            </h2>
                            <p className="text-dark-300 mb-4">{user.email}</p>


                            {/* Role Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium mb-6">
                                <div className="w-2 h-2 bg-primary-400 rounded-full" />
                                {user.role === 'ADMIN' ? 'Quản trị viên' :
                                    user.role === 'LIBRARIAN' ? 'Thủ thư' : 'Người dùng'}
                            </div>


                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="lg:col-span-2">
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-heading font-semibold text-dark-50">
                                    Thông tin cá nhân
                                </h3>
                                {!isEditing ? (
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Chỉnh sửa
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            onClick={handleCancel}
                                            className="flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Hủy
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            isLoading={isLoading}
                                            className="flex items-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            Lưu
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <Input
                                    label="Họ và tên"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    disabled={!isEditing}
                                    icon={<User className="w-4 h-4" />}
                                />

                                <Input
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={true} // Email cannot be changed
                                    icon={<Mail className="w-4 h-4" />}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-200 mb-2">
                                            Vai trò
                                        </label>
                                        <div className="input-field flex items-center gap-2">
                                            <Settings className="w-4 h-4 text-dark-400" />
                                            <span className="text-dark-50">
                                                {user.role === 'ADMIN' ? 'Quản trị viên' :
                                                    user.role === 'LIBRARIAN' ? 'Thủ thư' : 'Người dùng'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-dark-200 mb-2">
                                            Ngày tham gia
                                        </label>
                                        <div className="input-field flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-dark-400" />
                                            <span className="text-dark-50">
                                                {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: vi })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Actions */}
                        <div className="glass-card p-6 mt-6">
                            <h3 className="text-xl font-heading font-semibold text-dark-50 mb-4">
                                Tài khoản
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-dark-50">Đổi mật khẩu</h4>
                                        <p className="text-sm text-dark-400">Cập nhật mật khẩu để bảo mật tài khoản</p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setShowPasswordModal(true)}
                                    >
                                        Đổi mật khẩu
                                    </Button>
                                </div>


                                <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <div>
                                        <h4 className="font-medium text-red-400">Đăng xuất</h4>
                                        <p className="text-sm text-red-300">Đăng xuất khỏi tài khoản hiện tại</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        Đăng xuất
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Password Change Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Đổi mật khẩu 🔐"
            >
                <div className="py-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">
                                Mật khẩu hiện tại:
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPasswords.current ? "text" : "password"}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    icon={<Lock className="w-4 h-4" />}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-300"
                                >
                                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">
                                Mật khẩu mới:
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPasswords.new ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    placeholder="Nhập mật khẩu mới"
                                    icon={<Lock className="w-4 h-4" />}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-300"
                                >
                                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-dark-300 mb-2">
                                Xác nhận mật khẩu mới:
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    placeholder="Nhập lại mật khẩu mới"
                                    icon={<Lock className="w-4 h-4" />}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-300"
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <Button
                            variant="secondary"
                            onClick={() => setShowPasswordModal(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handlePasswordChange}
                            isLoading={isLoading}
                            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                            Đổi mật khẩu
                        </Button>
                    </div>
                </div>
            </Modal>


        </div>
    );
};

export default Profile;
