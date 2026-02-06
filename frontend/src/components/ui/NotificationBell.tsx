import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Clock, BookOpen, DollarSign, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

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

const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    // Fetch notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => apiClient.getNotifications({ limit: 20 }),
        enabled: isAuthenticated,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    // Fetch unread count
    const { data: unreadCount } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: () => apiClient.getUnreadNotificationCount(),
        enabled: isAuthenticated,
        refetchInterval: 30000,
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
                return <Clock className="w-4 h-4 text-red-400" />;
            case 'BOOK_APPROVED':
            case 'LOAN_APPROVED':
                return <BookOpen className="w-4 h-4 text-green-400" />;
            case 'BOOK_AVAILABLE':
                return <BookOpen className="w-4 h-4 text-blue-400" />;
            case 'BOOK_REJECTED':
            case 'LOAN_REJECTED':
                return <AlertCircle className="w-4 h-4 text-red-400" />;
            case 'PAYMENT_RECEIVED':
                return <DollarSign className="w-4 h-4 text-green-400" />;
            case 'REVIEW_HIDDEN':
                return <EyeOff className="w-4 h-4 text-yellow-400" />;
            case 'REVIEW_SHOWN':
                return <Eye className="w-4 h-4 text-green-400" />;
            default:
                return <Bell className="w-4 h-4 text-primary-400" />;
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

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Vừa xong';
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl hover:bg-white/10 transition-colors duration-200 group"
                title="Thông báo"
            >
                <Bell className="w-5 h-5 text-dark-300 group-hover:text-primary-400 transition-colors" />
                {unreadCount && unreadCount.count > 0 && (
                    <motion.span
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                        {unreadCount.count > 9 ? '9+' : unreadCount.count}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute right-0 mt-2 w-80 bg-dark-800/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl overflow-hidden z-50"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary-500/10 to-accent-500/10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-dark-50">Thông báo</h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount && unreadCount.count > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => markAllAsReadMutation.mutate()}
                                            disabled={markAllAsReadMutation.isPending}
                                            className="text-xs"
                                        >
                                            <Check className="w-3 h-3 mr-1" />
                                            Đọc tất cả
                                        </Button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-dark-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-4 text-center bg-gradient-to-br from-dark-700/30 to-dark-800/30">
                                    <LoadingSpinner size="sm" />
                                    <p className="text-sm text-dark-400 mt-2">Đang tải thông báo...</p>
                                </div>
                            ) : notificationsData?.notifications?.length > 0 ? (
                                notificationsData.notifications.map((notification: Notification) => (
                                    <motion.div
                                        key={notification._id}
                                        className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${!notification.isRead ? 'bg-gradient-to-r from-white/5 to-white/10' : 'bg-dark-700/50'
                                            } hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-200`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-dark-50 mb-1">
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-xs text-dark-300 mb-2">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-dark-400">
                                                                {formatTimeAgo(notification.createdAt)}
                                                            </span>
                                                            {!notification.isRead && (
                                                                <span className="w-2 h-2 bg-primary-400 rounded-full"></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 ml-2">
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={() => markAsReadMutation.mutate(notification._id)}
                                                                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                                                                title="Đánh dấu đã đọc"
                                                            >
                                                                <Check className="w-3 h-3 text-dark-400" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteNotificationMutation.mutate(notification._id)}
                                                            className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
                                                            title="Xóa thông báo"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-red-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-gradient-to-br from-dark-700/30 to-dark-800/30">
                                    <Bell className="w-12 h-12 text-dark-400 mx-auto mb-4" />
                                    <p className="text-dark-400">Chưa có thông báo nào</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
