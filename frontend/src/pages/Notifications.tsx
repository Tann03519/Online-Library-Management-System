import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, Clock, BookOpen, DollarSign, Eye, EyeOff, AlertCircle, Filter, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    isRead: boolean;
    priority: string;
    createdAt: string;
}

const Notifications: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        type: '',
        isRead: '',
        search: ''
    });

    // Fetch notifications
    const { data: notificationsData, isLoading, error } = useQuery({
        queryKey: ['notifications', filters],
        queryFn: () => apiClient.getNotifications({
            page: 1,
            limit: 50,
            type: filters.type || undefined,
            isRead: filters.isRead ? filters.isRead === 'true' : undefined
        }),
        enabled: isAuthenticated,
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => apiClient.markNotificationAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: () => apiClient.markAllNotificationsAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Delete notification mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'LOAN_OVERDUE':
            case 'LOAN_DUE_SOON':
                return <Clock className="w-5 h-5 text-red-400" />;
            case 'BOOK_APPROVED':
            case 'LOAN_APPROVED':
                return <BookOpen className="w-5 h-5 text-green-400" />;
            case 'BOOK_AVAILABLE':
                return <BookOpen className="w-5 h-5 text-blue-400" />;
            case 'BOOK_REJECTED':
            case 'LOAN_REJECTED':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            case 'PAYMENT_RECEIVED':
                return <DollarSign className="w-5 h-5 text-green-400" />;
            case 'FINE_ISSUED':
            case 'FINE_OVERDUE':
                return <DollarSign className="w-5 h-5 text-red-400" />;
            case 'FINE_PAID':
                return <DollarSign className="w-5 h-5 text-green-400" />;
            case 'FINE_WAIVED':
                return <DollarSign className="w-5 h-5 text-blue-400" />;
            case 'REVIEW_HIDDEN':
                return <EyeOff className="w-5 h-5 text-yellow-400" />;
            case 'REVIEW_SHOWN':
                return <Eye className="w-5 h-5 text-green-400" />;
            default:
                return <Bell className="w-5 h-5 text-primary-400" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return 'border-l-red-500 bg-red-500/10';
            case 'HIGH':
                return 'border-l-orange-500 bg-orange-500/10';
            case 'MEDIUM':
                return 'border-l-blue-500 bg-blue-500/10';
            case 'LOW':
                return 'border-l-gray-500 bg-gray-500/10';
            default:
                return 'border-l-blue-500 bg-blue-500/10';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'LOAN_OVERDUE':
                return 'Quá hạn trả sách';
            case 'LOAN_DUE_SOON':
                return 'Sắp đến hạn trả';
            case 'BOOK_APPROVED':
                return 'Sách được duyệt';
            case 'BOOK_REJECTED':
                return 'Sách bị từ chối';
            case 'LOAN_APPROVED':
                return 'Mượn sách được duyệt';
            case 'LOAN_REJECTED':
                return 'Mượn sách bị từ chối';
            case 'PAYMENT_RECEIVED':
                return 'Đã thanh toán';
            case 'FINE_ISSUED':
                return 'Phạt mới';
            case 'FINE_OVERDUE':
                return 'Phạt quá hạn';
            case 'FINE_PAID':
                return 'Đã thanh toán phạt';
            case 'FINE_WAIVED':
                return 'Phạt được miễn';
            case 'REVIEW_HIDDEN':
                return 'Review bị ẩn';
            case 'REVIEW_SHOWN':
                return 'Review được hiện lại';
            case 'BOOK_AVAILABLE':
                return 'Sách có sẵn';
            default:
                return 'Thông báo';
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    };

    const filteredNotifications = notificationsData?.notifications?.filter((notification: Notification) => {
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            return notification.title.toLowerCase().includes(searchTerm) ||
                notification.message.toLowerCase().includes(searchTerm);
        }
        return true;
    }) || [];

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="text-center">
                    <Bell className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-dark-50 mb-2">Cần đăng nhập</h2>
                    <p className="text-dark-400">Vui lòng đăng nhập để xem thông báo</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-heading font-bold gradient-text mb-2">
                                Thông báo
                            </h1>
                            <p className="text-dark-300">
                                Quản lý và theo dõi các thông báo hệ thống
                            </p>
                        </div>
                        {notificationsData?.notifications?.some((n: Notification) => !n.isRead) && (
                            <Button
                                variant="primary"
                                onClick={() => markAllAsReadMutation.mutate()}
                                disabled={markAllAsReadMutation.isPending}
                                className="flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Đọc tất cả
                            </Button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="glass-card p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">
                                    Loại thông báo
                                </label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="LOAN_OVERDUE">Quá hạn trả sách</option>
                                    <option value="LOAN_DUE_SOON">Sắp đến hạn trả</option>
                                    <option value="BOOK_APPROVED">Sách được duyệt</option>
                                    <option value="BOOK_REJECTED">Sách bị từ chối</option>
                                    <option value="LOAN_APPROVED">Mượn sách được duyệt</option>
                                    <option value="LOAN_REJECTED">Mượn sách bị từ chối</option>
                                    <option value="PAYMENT_RECEIVED">Đã thanh toán</option>
                                    <option value="FINE_ISSUED">Phạt mới</option>
                                    <option value="FINE_OVERDUE">Phạt quá hạn</option>
                                    <option value="FINE_PAID">Đã thanh toán phạt</option>
                                    <option value="FINE_WAIVED">Phạt được miễn</option>
                                    <option value="REVIEW_HIDDEN">Review bị ẩn</option>
                                    <option value="REVIEW_SHOWN">Review được hiện lại</option>
                                    <option value="BOOK_AVAILABLE">Sách có sẵn</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">
                                    Trạng thái
                                </label>
                                <select
                                    value={filters.isRead}
                                    onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="false">Chưa đọc</option>
                                    <option value="true">Đã đọc</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-2">
                                    Tìm kiếm
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm thông báo..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-dark-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <LoadingSpinner size="lg" />
                        <p className="text-dark-400 mt-4">Đang tải thông báo...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-dark-50 mb-2">Lỗi tải thông báo</h3>
                        <p className="text-dark-400">Không thể tải danh sách thông báo</p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    <div className="space-y-4">
                        {filteredNotifications.map((notification: Notification, index: number) => (
                            <motion.div
                                key={notification._id}
                                className={`glass-card p-6 border-l-4 ${getPriorityColor(notification.priority)} ${!notification.isRead ? 'bg-white/5' : ''
                                    } hover:bg-white/10 transition-all duration-200`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-semibold text-dark-50">
                                                        {notification.title}
                                                    </h3>
                                                    <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                                                        {getTypeLabel(notification.type)}
                                                    </span>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-primary-400 rounded-full"></span>
                                                    )}
                                                </div>
                                                <p className="text-dark-300 mb-3">
                                                    {notification.message}
                                                </p>

                                                {/* Fine details for fine notifications */}
                                                {notification.type.startsWith('FINE_') && notification.data && (
                                                    <div className="bg-dark-700/50 p-3 rounded-lg mb-3">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="text-sm text-dark-400">Loại phạt:</span>
                                                                <span className="ml-2 text-dark-200">
                                                                    {notification.data.type === 'LATE_RETURN' ? 'Trả muộn' :
                                                                        notification.data.type === 'DAMAGE' ? 'Hư hỏng sách' :
                                                                            notification.data.type === 'LOSS' ? 'Mất sách' : notification.data.type}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm text-dark-400">Số tiền:</span>
                                                                <span className="ml-2 text-lg font-semibold text-red-400">
                                                                    {notification.data.amount?.toLocaleString('vi-VN')} {notification.data.currency || 'VND'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {notification.data.description && (
                                                            <div className="mt-2">
                                                                <span className="text-sm text-dark-400">Mô tả:</span>
                                                                <p className="text-sm text-dark-300 mt-1">{notification.data.description}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 text-sm text-dark-400">
                                                    <span>{formatTimeAgo(notification.createdAt)}</span>
                                                    <span className="capitalize">{notification.priority.toLowerCase()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => markAsReadMutation.mutate(notification._id)}
                                                        disabled={markAsReadMutation.isPending}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Đã đọc
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteNotificationMutation.mutate(notification._id)}
                                                    disabled={deleteNotificationMutation.isPending}
                                                    className="flex items-center gap-1 text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Bell className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-dark-50 mb-2">Chưa có thông báo</h3>
                        <p className="text-dark-400">Bạn chưa có thông báo nào</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
