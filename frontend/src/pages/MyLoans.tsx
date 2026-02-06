import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    Eye,
    Download,
    Plus,
    XCircle,
    RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

const MyLoans: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'pending' | 'current' | 'history'>('pending');
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [extensionDays, setExtensionDays] = useState(7);
    const [reason, setReason] = useState('');

    // Fetch user's current loans (both PENDING and BORROWED)
    const { data: currentLoans, isLoading: isLoadingCurrent, refetch: refetchCurrent, error: currentError } = useQuery({
        queryKey: ['user-current-loans'],
        queryFn: () => apiClient.getUserLoans(), // Get all loans, filter in frontend
    });

    // Filter loans by status
    const pendingLoans = currentLoans?.loans?.filter((loan: any) =>
        loan.status === 'PENDING'
    ) || [];

    const currentLoansFiltered = currentLoans?.loans?.filter((loan: any) =>
        loan.status === 'BORROWED'
    ) || [];

    const historyLoansFiltered = currentLoans?.loans?.filter((loan: any) =>
        ['RETURNED', 'CANCELLED'].includes(loan.status)
    ) || [];

    // Debug logging
    console.log('Current loans data:', currentLoans);
    console.log('Current loans error:', currentError);
    console.log('Filtered current loans:', currentLoansFiltered);

    // Fetch user's loan history
    const { data: historyLoans, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
        queryKey: ['user-history-loans'],
        queryFn: () => apiClient.getUserLoans({ status: 'RETURNED' }),
    });

    // Fetch user's extension requests
    const { data: extensions, isLoading: isLoadingExtensions, refetch: refetchExtensions } = useQuery({
        queryKey: ['user-extensions'],
        queryFn: () => apiClient.getUserExtensions(1, 50),
    });

    const handleRequestExtension = async () => {
        if (!selectedLoan) return;

        try {
            await apiClient.requestExtension(selectedLoan._id, extensionDays, reason);
            toast.success('Đã gửi yêu cầu gia hạn');
            setShowExtensionModal(false);
            setSelectedLoan(null);
            setExtensionDays(7);
            setReason('');
            refetchExtensions();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Có lỗi xảy ra');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'BORROWED':
                return 'bg-green-500/20 text-green-400';
            case 'RETURNED':
                return 'bg-blue-500/20 text-blue-400';
            case 'OVERDUE':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const formatStatus = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'PENDING': 'Chờ duyệt',
            'BORROWED': 'Đang mượn',
            'RETURNED': 'Đã trả',
            'OVERDUE': 'Quá hạn'
        };
        return statusMap[status] || status;
    };

    const isOverdue = (dueDate: string) => {
        return isAfter(new Date(), new Date(dueDate));
    };

    const getDaysUntilDue = (dueDate: string) => {
        const days = differenceInDays(new Date(dueDate), new Date());
        return days;
    };

    return (
        <div className="min-h-screen bg-dark-900 pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-bold text-dark-50 mb-4">
                        Sách của tôi
                    </h1>
                    <p className="text-dark-300">
                        Quản lý sách đang mượn và lịch sử mượn sách
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-8">
                    <div className="flex space-x-1 glass rounded-xl p-1">
                        {[
                            { id: 'pending', label: 'Chờ duyệt', icon: Clock, count: pendingLoans.length },
                            { id: 'current', label: 'Đang mượn', icon: BookOpen, count: currentLoansFiltered.length },
                            { id: 'history', label: 'Lịch sử', icon: Clock, count: historyLoansFiltered.length },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-primary-500 text-white'
                                    : 'text-dark-300 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className="bg-accent-500 text-white text-xs rounded-full px-2 py-1">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="glass-card p-6">
                    {activeTab === 'pending' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-heading font-semibold text-dark-50">
                                    Yêu cầu chờ duyệt
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={() => refetchCurrent()}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Làm mới
                                </Button>
                            </div>

                            {isLoadingCurrent ? (
                                <LoadingSpinner size="lg" text="Đang tải..." />
                            ) : currentError ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">❌</div>
                                    <h3 className="text-xl font-heading font-semibold text-red-400 mb-2">
                                        Lỗi tải dữ liệu
                                    </h3>
                                    <p className="text-dark-400 mb-4">
                                        {currentError?.message || 'Không thể tải danh sách yêu cầu chờ duyệt'}
                                    </p>
                                    <Button
                                        variant="primary"
                                        onClick={() => refetchCurrent()}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Thử lại
                                    </Button>
                                </div>
                            ) : pendingLoans.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">⏳</div>
                                    <h3 className="text-xl font-heading font-semibold text-dark-300 mb-2">
                                        Không có yêu cầu chờ duyệt
                                    </h3>
                                    <p className="text-dark-400">
                                        Bạn chưa có yêu cầu mượn sách nào chờ duyệt
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingLoans.map((loan: any) => (
                                        <motion.div
                                            key={loan._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass-card p-6 hover:bg-dark-700/50 transition-colors"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen className="w-4 h-4 text-primary-400" />
                                                            <span className="font-medium text-dark-50">
                                                                {loan.code}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-green-400" />
                                                            <span className="text-dark-300">
                                                                Hạn: {format(new Date(loan.dueDate), 'dd/MM/yyyy', { locale: vi })}
                                                            </span>
                                                        </div>
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                                            Chờ duyệt
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {loan.items?.map((item: any, index: number) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-sm"
                                                            >
                                                                <BookOpen className="w-3 h-3" />
                                                                {item.bookId?.title}
                                                                <span className="text-xs bg-primary-500/30 px-2 py-0.5 rounded">
                                                                    x{item.qty}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {loan.notes && (
                                                        <div className="bg-dark-700/50 p-3 rounded-lg mb-4">
                                                            <p className="text-sm text-dark-300">
                                                                <span className="font-medium">Ghi chú:</span> {loan.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => window.print()}
                                                        className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        In phiếu
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'current' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-heading font-semibold text-dark-50">
                                    Sách đang mượn
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={() => refetchCurrent()}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Làm mới
                                </Button>
                            </div>

                            {isLoadingCurrent ? (
                                <LoadingSpinner size="lg" text="Đang tải..." />
                            ) : currentError ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">❌</div>
                                    <h3 className="text-xl font-heading font-semibold text-red-400 mb-2">
                                        Lỗi tải dữ liệu
                                    </h3>
                                    <p className="text-dark-400 mb-4">
                                        {currentError?.message || 'Không thể tải danh sách sách đang mượn'}
                                    </p>
                                    <Button
                                        variant="primary"
                                        onClick={() => refetchCurrent()}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Thử lại
                                    </Button>
                                </div>
                            ) : currentLoansFiltered.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📚</div>
                                    <h3 className="text-xl font-heading font-semibold text-dark-300 mb-2">
                                        Không có sách đang mượn
                                    </h3>
                                    <p className="text-dark-400">
                                        Bạn chưa mượn sách nào hoặc đã trả hết sách
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {currentLoansFiltered.map((loan: any) => (
                                        <motion.div
                                            key={loan._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass-card p-6 hover:bg-dark-700/50 transition-colors"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen className="w-4 h-4 text-primary-400" />
                                                            <span className="font-medium text-dark-50">
                                                                {loan.code}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-green-400" />
                                                            <span className="text-dark-300">
                                                                Hạn: {format(new Date(loan.dueDate), 'dd/MM/yyyy', { locale: vi })}
                                                            </span>
                                                        </div>
                                                        {isOverdue(loan.dueDate) && (
                                                            <div className="flex items-center gap-2">
                                                                <AlertCircle className="w-4 h-4 text-red-400" />
                                                                <span className="text-red-400 font-medium">
                                                                    Quá hạn {Math.abs(getDaysUntilDue(loan.dueDate))} ngày
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {loan.items?.map((item: any, index: number) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-sm"
                                                            >
                                                                <BookOpen className="w-3 h-3" />
                                                                {item.bookId?.title}
                                                                <span className="text-xs bg-primary-500/30 px-2 py-0.5 rounded">
                                                                    x{item.qty}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {loan.notes && (
                                                        <div className="bg-dark-700/50 p-3 rounded-lg mb-4">
                                                            <p className="text-sm text-dark-300">
                                                                <span className="font-medium">Ghi chú:</span> {loan.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    {loan.status === 'BORROWED' && (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSelectedLoan(loan);
                                                                setShowExtensionModal(true);
                                                            }}
                                                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                                        >
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            Gia hạn
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => window.print()}
                                                        className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        In phiếu
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-heading font-semibold text-dark-50">
                                    Lịch sử mượn sách
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={() => refetchHistory()}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Làm mới
                                </Button>
                            </div>

                            {isLoadingHistory ? (
                                <LoadingSpinner size="lg" text="Đang tải..." />
                            ) : historyLoansFiltered.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📖</div>
                                    <h3 className="text-xl font-heading font-semibold text-dark-300 mb-2">
                                        Chưa có lịch sử mượn sách
                                    </h3>
                                    <p className="text-dark-400">
                                        Lịch sử mượn sách của bạn sẽ hiển thị ở đây
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historyLoansFiltered.map((loan: any) => (
                                        <motion.div
                                            key={loan._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass-card p-6 hover:bg-dark-700/50 transition-colors"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen className="w-4 h-4 text-primary-400" />
                                                            <span className="font-medium text-dark-50">
                                                                {loan.code}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-green-400" />
                                                            <span className="text-dark-300">
                                                                Trả: {format(new Date(loan.returnDate || loan.updatedAt), 'dd/MM/yyyy', { locale: vi })}
                                                            </span>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                                                            {formatStatus(loan.status)}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {loan.items?.map((item: any, index: number) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-300 rounded-lg text-sm"
                                                            >
                                                                <BookOpen className="w-3 h-3" />
                                                                {item.bookId?.title}
                                                                <span className="text-xs bg-primary-500/30 px-2 py-0.5 rounded">
                                                                    x{item.qty}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {loan.notes && (
                                                        <div className="bg-dark-700/50 p-3 rounded-lg mb-4">
                                                            <p className="text-sm text-dark-300">
                                                                <span className="font-medium">Ghi chú:</span> {loan.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => window.print()}
                                                        className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        In phiếu
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Extension Modal */}
                <Modal
                    isOpen={showExtensionModal}
                    onClose={() => setShowExtensionModal(false)}
                    title="Gia hạn mượn sách"
                >
                    <div className="py-6">
                        {selectedLoan && (
                            <div className="space-y-4">
                                <div className="bg-dark-700/50 p-4 rounded-lg">
                                    <h3 className="font-medium text-dark-50 mb-2">Thông tin phiếu mượn</h3>
                                    <p className="text-sm text-dark-300">
                                        <span className="font-medium">Mã phiếu:</span> {selectedLoan.code}
                                    </p>
                                    <p className="text-sm text-dark-300">
                                        <span className="font-medium">Hạn hiện tại:</span> {format(new Date(selectedLoan.dueDate), 'dd/MM/yyyy', { locale: vi })}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Số ngày gia hạn
                                    </label>
                                    <select
                                        value={extensionDays}
                                        onChange={(e) => setExtensionDays(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 input-field"
                                    >
                                        <option value={7}>7 ngày</option>
                                        <option value={14}>14 ngày</option>
                                        <option value={21}>21 ngày</option>
                                        <option value={30}>30 ngày</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Lý do gia hạn
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Nhập lý do gia hạn..."
                                        className="w-full px-3 py-2 input-field resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowExtensionModal(false)}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleRequestExtension}
                                    >
                                        Gửi yêu cầu
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default MyLoans;