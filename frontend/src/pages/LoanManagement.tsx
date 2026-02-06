import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Clock,
    AlertTriangle,
    User,
    Calendar,
    DollarSign,
    RefreshCw,
    Eye,
    Check
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const LoanManagement: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'pending' | 'borrowed' | 'extensions' | 'fines'>('pending');
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [selectedFine, setSelectedFine] = useState<any>(null);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [showFineModal, setShowFineModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [actionNotes, setActionNotes] = useState('');
    const [returnConditions, setReturnConditions] = useState<{ [key: string]: { condition: string, notes: string, damageLevel: number } }>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [finePolicy, setFinePolicy] = useState<any>(null);

    // Fetch pending loans
    const { data: pendingLoans, isLoading: isLoadingLoans, refetch: refetchLoans, error: loansError } = useQuery({
        queryKey: ['pending-loans'],
        queryFn: () => apiClient.getPendingLoans(1, 20, 'PENDING'),
        enabled: !!(user && (user.role === 'ADMIN' || user.role === 'LIBRARIAN'))
    });

    // Fetch borrowed loans
    const { data: borrowedLoans, isLoading: isLoadingBorrowed, refetch: refetchBorrowed } = useQuery({
        queryKey: ['borrowed-loans'],
        queryFn: () => apiClient.getPendingLoans(1, 20, 'BORROWED'),
        enabled: !!(user && (user.role === 'ADMIN' || user.role === 'LIBRARIAN'))
    });

    // Fetch extensions
    const { data: extensions, isLoading: isLoadingExtensions, refetch: refetchExtensions } = useQuery({
        queryKey: ['extensions'],
        queryFn: () => apiClient.getExtensions(1, 20, 'PENDING'),
        enabled: !!(user && (user.role === 'ADMIN' || user.role === 'LIBRARIAN'))
    });

    // Fetch fines
    const { data: fines, isLoading: isLoadingFines, refetch: refetchFines } = useQuery({
        queryKey: ['fines'],
        queryFn: async () => {
            const result = await apiClient.getFines(1, 20, 'PENDING');
            console.log('Fines data received:', result);
            return result;
        },
        enabled: !!(user && (user.role === 'ADMIN' || user.role === 'LIBRARIAN'))
    });

    // Fetch fine policy
    const { data: policyData } = useQuery({
        queryKey: ['fine-policy'],
        queryFn: () => apiClient.getFinePolicy(),
        enabled: !!(user && (user.role === 'ADMIN' || user.role === 'LIBRARIAN'))
    });

    // Update fine policy when data is loaded
    React.useEffect(() => {
        if (policyData) {
            setFinePolicy(policyData);
        }
    }, [policyData]);

    // Debug logging
    console.log('User role:', user?.role);
    console.log('Pending loans data:', pendingLoans);
    console.log('Is loading loans:', isLoadingLoans);
    console.log('Loans error:', loansError);

    // Check if user has permission
    if (!user || (user.role !== 'ADMIN' && user.role !== 'LIBRARIAN')) {
        return (
            <div className="min-h-screen bg-dark-900 pt-16 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚫</div>
                    <h2 className="text-2xl font-heading font-bold text-dark-300 mb-4">
                        Không có quyền truy cập
                    </h2>
                    <p className="text-dark-400 mb-8">
                        Bạn cần có quyền quản trị viên hoặc thủ thư để truy cập trang này.
                    </p>
                    <p className="text-sm text-dark-500">
                        Quyền hiện tại: {user?.role || 'Chưa đăng nhập'}
                    </p>
                </div>
            </div>
        );
    }

    const handleApproveLoan = async () => {
        if (!selectedLoan) return;

        console.log('Approving loan:', selectedLoan._id);
        console.log('Loan items:', selectedLoan.items);

        setIsProcessing(true);
        try {
            const result = await apiClient.approveLoan(selectedLoan._id, actionNotes);
            console.log('Loan approval result:', result);
            toast.success('Đã duyệt mượn sách');
            setShowLoanModal(false);
            setSelectedLoan(null);
            setActionNotes('');
            refetchLoans();
        } catch (error: any) {
            console.error('Approve loan error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                'Có lỗi xảy ra khi duyệt mượn sách';
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectLoan = async () => {
        if (!selectedLoan) return;

        setIsProcessing(true);
        try {
            await apiClient.rejectLoan(selectedLoan._id, actionNotes);
            toast.success('Đã từ chối mượn sách');
            setShowLoanModal(false);
            setSelectedLoan(null);
            setActionNotes('');
            refetchLoans();
        } catch (error: any) {
            console.error('Reject loan error:', error);
            const errorMessage = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                'Có lỗi xảy ra khi từ chối mượn sách';
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const showConfirmation = (message: string, action: () => void) => {
        setConfirmMessage(message);
        setConfirmAction(() => action);
        setShowConfirmDialog(true);
    };

    const handleConfirm = () => {
        if (confirmAction) {
            confirmAction();
        }
        setShowConfirmDialog(false);
        setConfirmAction(null);
        setConfirmMessage('');
    };

    const handleApproveExtension = async () => {
        if (!selectedLoan) return;

        setIsProcessing(true);
        try {
            await apiClient.approveExtension(selectedLoan._id, actionNotes);
            toast.success('Đã duyệt gia hạn');
            setShowExtensionModal(false);
            setSelectedLoan(null);
            setActionNotes('');
            refetchExtensions();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Có lỗi xảy ra');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectExtension = async () => {
        if (!selectedLoan) return;

        setIsProcessing(true);
        try {
            await apiClient.rejectExtension(selectedLoan._id, actionNotes);
            toast.success('Đã từ chối gia hạn');
            setShowExtensionModal(false);
            setSelectedLoan(null);
            setActionNotes('');
            refetchExtensions();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Có lỗi xảy ra');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayFine = async () => {
        if (!selectedFine) return;

        setIsProcessing(true);
        try {
            await apiClient.payFine(selectedFine._id);
            toast.success('Đã thanh toán phạt thành công');
            setShowFineModal(false);
            setSelectedLoan(null);
            setActionNotes('');
            refetchFines();
        } catch (error: any) {
            console.error('Pay fine error:', error);
            const errorMessage = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                'Có lỗi xảy ra khi thanh toán phạt';
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWaiveFine = async () => {
        if (!selectedFine) return;

        setIsProcessing(true);
        try {
            await apiClient.waiveFine(selectedFine._id, actionNotes);
            toast.success('Đã miễn phạt thành công');
            setShowFineModal(false);
            setSelectedLoan(null);
            setActionNotes('');
            refetchFines();
        } catch (error: any) {
            console.error('Waive fine error:', error);
            const errorMessage = error.response?.data?.error?.message ||
                error.response?.data?.message ||
                'Có lỗi xảy ra khi miễn phạt';
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReturnLoan = async () => {
        if (!selectedLoan) return;

        setIsProcessing(true);
        try {
            // Prepare returned items with conditions
            const returnedItems = selectedLoan.items.map((item: any) => ({
                bookId: item.bookId._id,
                qty: item.qty,
                condition: returnConditions[item.bookId._id]?.condition || 'GOOD',
                damageLevel: returnConditions[item.bookId._id]?.damageLevel || 0,
                notes: returnConditions[item.bookId._id]?.notes || ''
            }));

            await apiClient.returnLoan(selectedLoan._id, returnedItems, actionNotes);
            toast.success('Đã trả sách thành công');
            setShowReturnModal(false);
            setSelectedLoan(null);
            setReturnConditions({});
            setActionNotes('');
            refetchBorrowed();
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || 'Có lỗi xảy ra');
        } finally {
            setIsProcessing(false);
        }
    };

    // Format status to Vietnamese
    const formatStatus = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'PENDING': 'Chờ duyệt',
            'BORROWED': 'Đang mượn',
            'PARTIAL_RETURN': 'Trả một phần',
            'RETURNED': 'Đã trả',
            'OVERDUE': 'Quá hạn',
            'CANCELLED': 'Đã hủy',
            // Fine statuses
            'PAID': 'Đã thanh toán',
            'WAIVED': 'Đã miễn phạt'
        };
        return statusMap[status] || status;
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'BORROWED':
                return 'bg-green-500/20 text-green-400';
            case 'PARTIAL_RETURN':
                return 'bg-orange-500/20 text-orange-400';
            case 'OVERDUE':
                return 'bg-red-500/20 text-red-400';
            case 'RETURNED':
                return 'bg-blue-500/20 text-blue-400';
            case 'CANCELLED':
                return 'bg-gray-500/20 text-gray-400';
            // Fine statuses
            case 'PAID':
                return 'bg-green-500/20 text-green-400';
            case 'WAIVED':
                return 'bg-blue-500/20 text-blue-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };


    return (
        <div className="min-h-screen bg-dark-900 pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-bold text-dark-50 mb-4">
                        Quản lý mượn sách
                    </h1>
                    <p className="text-dark-300">
                        Duyệt yêu cầu mượn sách, gia hạn và xử lý phạt
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 glass rounded-xl p-1">
                        {[
                            { id: 'pending', label: 'Chờ duyệt', icon: Clock, count: pendingLoans?.meta?.total || 0 },
                            { id: 'borrowed', label: 'Đang mượn', icon: BookOpen, count: borrowedLoans?.meta?.total || 0 },
                            { id: 'extensions', label: 'Gia hạn', icon: Calendar, count: extensions?.meta?.total || 0 },
                            { id: 'fines', label: 'Phạt', icon: DollarSign, count: fines?.meta?.total || 0 },
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-heading font-semibold text-dark-50">
                                        Yêu cầu mượn sách chờ duyệt
                                    </h2>
                                    <p className="text-sm text-dark-400 mt-1">
                                        Tổng: {pendingLoans?.meta?.total || 0} yêu cầu
                                        {pendingLoans?.data && ` (${pendingLoans.data.length} hiển thị)`}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => refetchLoans()}
                                    className="flex items-center gap-2 self-start sm:self-auto"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Làm mới
                                </Button>
                            </div>

                            {isLoadingLoans ? (
                                <LoadingSpinner size="lg" text="Đang tải..." />
                            ) : loansError ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">❌</div>
                                    <h3 className="text-xl font-heading font-semibold text-red-400 mb-2">
                                        Lỗi tải dữ liệu
                                    </h3>
                                    <p className="text-dark-400 mb-4">
                                        {loansError?.message || 'Không thể tải danh sách yêu cầu mượn sách'}
                                    </p>
                                    <Button
                                        variant="primary"
                                        onClick={() => refetchLoans()}
                                        className="flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Thử lại
                                    </Button>
                                </div>
                            ) : pendingLoans?.data?.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📚</div>
                                    <h3 className="text-xl font-heading font-semibold text-dark-300 mb-2">
                                        Không có yêu cầu nào
                                    </h3>
                                    <p className="text-dark-400">
                                        Hiện tại không có yêu cầu mượn sách nào chờ duyệt
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingLoans?.data?.map((loan: any) => (
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
                                                            <User className="w-4 h-4 text-primary-400" />
                                                            <span className="font-medium text-dark-50">
                                                                {loan.readerUserId?.fullName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen className="w-4 h-4 text-accent-400" />
                                                            <span className="text-dark-300">
                                                                {loan.items?.length} cuốn sách
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-green-400" />
                                                            <span className="text-dark-300">
                                                                Hạn: {new Date(loan.dueDate).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
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
                                                        <p className="text-sm text-dark-400 mb-3">
                                                            <strong>Ghi chú:</strong> {loan.notes}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedLoan(loan);
                                                            setShowLoanModal(true);
                                                        }}
                                                        className="flex items-center justify-center gap-2"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Xem chi tiết
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedLoan(loan);
                                                            setActionNotes('');
                                                            setShowLoanModal(true);
                                                        }}
                                                        className="flex items-center justify-center gap-2"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Duyệt
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'borrowed' && (
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-heading font-semibold text-dark-50">
                                        Sách đang mượn
                                    </h2>
                                    <p className="text-sm text-dark-400 mt-1">
                                        Tổng: {borrowedLoans?.meta?.total || 0} phiếu mượn
                                        {borrowedLoans?.data && ` (${borrowedLoans.data.length} hiển thị)`}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => refetchBorrowed()}
                                    className="flex items-center gap-2 self-start sm:self-auto"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Làm mới
                                </Button>
                            </div>

                            {isLoadingBorrowed ? (
                                <LoadingSpinner size="lg" text="Đang tải..." />
                            ) : borrowedLoans?.data?.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📚</div>
                                    <h3 className="text-xl font-heading font-semibold text-dark-300 mb-2">
                                        Không có sách đang mượn
                                    </h3>
                                    <p className="text-dark-400">
                                        Hiện tại không có sách nào đang được mượn
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {borrowedLoans?.data?.map((loan: any) => (
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
                                                            <User className="w-4 h-4 text-primary-400" />
                                                            <span className="font-medium text-dark-50">
                                                                {loan.readerUserId?.fullName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen className="w-4 h-4 text-accent-400" />
                                                            <span className="text-dark-300">
                                                                {loan.items?.length} cuốn sách
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-green-400" />
                                                            <span className="text-dark-300">
                                                                Hạn: {new Date(loan.dueDate).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
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
                                                        onClick={() => {
                                                            setSelectedLoan(loan);
                                                            // Initialize return conditions for each item
                                                            const initialConditions: { [key: string]: { condition: string, notes: string, damageLevel: number } } = {};
                                                            loan.items?.forEach((item: any) => {
                                                                initialConditions[item.bookId._id] = {
                                                                    condition: 'GOOD',
                                                                    notes: '',
                                                                    damageLevel: 0
                                                                };
                                                            });
                                                            setReturnConditions(initialConditions);
                                                            setActionNotes('');
                                                            setShowReturnModal(true);
                                                        }}
                                                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                                    >
                                                        Trả sách
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'extensions' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-heading font-semibold text-dark-50">
                                    Yêu cầu gia hạn
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={() => refetchExtensions()}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Làm mới
                                </Button>
                            </div>

                            {isLoadingExtensions ? (
                                <LoadingSpinner size="lg" text="Đang tải..." />
                            ) : extensions?.data?.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📅</div>
                                    <h3 className="text-xl font-heading font-semibold text-dark-300 mb-2">
                                        Không có yêu cầu gia hạn
                                    </h3>
                                    <p className="text-dark-400">
                                        Hiện tại không có yêu cầu gia hạn nào chờ duyệt
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {extensions?.data?.map((extension: any) => (
                                        <motion.div
                                            key={extension._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass-card p-6 hover:bg-dark-700/50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4 text-primary-400" />
                                                            <span className="font-medium text-dark-50">
                                                                {extension.userId?.fullName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-accent-400" />
                                                            <span className="text-dark-300">
                                                                Gia hạn {extension.extensionDays} ngày
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-green-400" />
                                                            <span className="text-dark-300">
                                                                Đến: {new Date(extension.newDueDate).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {extension.reason && (
                                                        <p className="text-sm text-dark-400 mb-3">
                                                            <strong>Lý do:</strong> {extension.reason}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedLoan(extension);
                                                            setActionNotes('');
                                                            setShowExtensionModal(true);
                                                        }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Duyệt
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'fines' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-heading font-semibold text-dark-50">
                                    Danh sách phạt
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={() => refetchFines()}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Làm mới
                                </Button>
                            </div>

                            {isLoadingFines ? (
                                <LoadingSpinner size="lg" text="Đang tải..." />
                            ) : fines?.data?.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💰</div>
                                    <h3 className="text-xl font-heading font-semibold text-dark-300 mb-2">
                                        Không có phạt nào
                                    </h3>
                                    <p className="text-dark-400">
                                        Hiện tại không có phạt nào chờ xử lý
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {fines?.data?.filter((fine: any) => fine.status === 'PENDING').map((fine: any) => {
                                        console.log('Fine item:', fine);
                                        return (
                                            <motion.div
                                                key={fine._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="glass-card p-6 hover:bg-dark-700/50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-4 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-primary-400" />
                                                                <span className="font-medium text-dark-50">
                                                                    {fine.userId?.fullName || 'Chưa có thông tin'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <DollarSign className="w-4 h-4 text-accent-400" />
                                                                <span className="text-dark-300">
                                                                    {fine.amount?.toLocaleString('vi-VN')} {fine.currency}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                                                <span className="text-dark-300">
                                                                    {fine.type === 'LATE_RETURN' ? 'Trả muộn' :
                                                                        fine.type === 'DAMAGE' ? 'Hư hỏng' :
                                                                            fine.type === 'LOSS' ? 'Mất sách' : fine.type}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fine.status)}`}>
                                                                    {formatStatus(fine.status)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {fine.description && (
                                                            <p className="text-sm text-dark-400 mb-3">
                                                                <strong>Mô tả:</strong> {fine.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedFine(fine);
                                                                setActionNotes('');
                                                                setShowFineModal(true);
                                                            }}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                            Xử lý
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Loan Modal */}
            <Modal
                isOpen={showLoanModal}
                onClose={() => setShowLoanModal(false)}
                title="Chi tiết yêu cầu mượn sách"
            >
                <div className="py-6">
                    {selectedLoan && (
                        <div className="space-y-6">
                            {/* Loan Information */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Mã yêu cầu
                                        </label>
                                        <p className="text-dark-50 font-mono text-sm bg-dark-700 px-3 py-2 rounded">
                                            {selectedLoan.code}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Trạng thái
                                        </label>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLoan.status)}`}>
                                            {formatStatus(selectedLoan.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Người mượn
                                        </label>
                                        <p className="text-dark-50">
                                            {selectedLoan.readerUserId?.fullName}
                                        </p>
                                        <p className="text-sm text-dark-400">
                                            {selectedLoan.readerUserId?.email}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Hạn trả
                                        </label>
                                        <p className="text-dark-50">
                                            {new Date(selectedLoan.dueDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Danh sách sách
                                    </label>
                                    <div className="space-y-2">
                                        {selectedLoan.items?.map((item: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-dark-50">
                                                        {item.bookId?.title}
                                                    </h4>
                                                    <p className="text-sm text-dark-400">
                                                        Tác giả: {item.bookId?.authors?.join(', ')}
                                                    </p>
                                                    <p className="text-xs text-dark-500">
                                                        ISBN: {item.bookId?.isbn}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm text-dark-300">
                                                        Số lượng: {item.qty}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedLoan.notes && (
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Ghi chú
                                        </label>
                                        <p className="text-dark-50 bg-dark-700 px-3 py-2 rounded">
                                            {selectedLoan.notes}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Ngày tạo
                                        </label>
                                        <p className="text-dark-50">
                                            {new Date(selectedLoan.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Tạo bởi
                                        </label>
                                        <p className="text-dark-50">
                                            {selectedLoan.createdByRole}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Section */}
                            <div className="border-t border-dark-600 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Ghi chú xử lý (tùy chọn)
                                    </label>
                                    <textarea
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                        placeholder="Nhập ghi chú xử lý..."
                                        className="w-full px-3 py-2 input-field resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowLoanModal(false)}
                                    >
                                        Đóng
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => showConfirmation('Bạn có chắc chắn muốn từ chối yêu cầu mượn sách này?', handleRejectLoan)}
                                        disabled={isProcessing}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Từ chối'}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleApproveLoan}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Duyệt'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Extension Modal */}
            <Modal
                isOpen={showExtensionModal}
                onClose={() => setShowExtensionModal(false)}
                title="Chi tiết yêu cầu gia hạn"
            >
                <div className="py-6">
                    {selectedLoan && (
                        <div className="space-y-6">
                            {/* Extension Information */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Người yêu cầu
                                        </label>
                                        <p className="text-dark-50">
                                            {selectedLoan.userId?.fullName || 'Chưa có thông tin'}
                                        </p>
                                        <p className="text-sm text-dark-400">
                                            {selectedLoan.userId?.email || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Trạng thái
                                        </label>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLoan.status)}`}>
                                            {formatStatus(selectedLoan.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Số ngày gia hạn
                                        </label>
                                        <p className="text-dark-50 text-lg font-semibold">
                                            {selectedLoan.extensionDays} ngày
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Hạn mới
                                        </label>
                                        <p className="text-dark-50">
                                            {new Date(selectedLoan.newDueDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                {selectedLoan.reason && (
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Lý do gia hạn
                                        </label>
                                        <p className="text-dark-50 bg-dark-700 px-3 py-2 rounded">
                                            {selectedLoan.reason}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Ngày yêu cầu
                                        </label>
                                        <p className="text-dark-50">
                                            {new Date(selectedLoan.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Hạn cũ
                                        </label>
                                        <p className="text-dark-50">
                                            {new Date(selectedLoan.originalDueDate).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Section */}
                            <div className="border-t border-dark-600 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Ghi chú xử lý (tùy chọn)
                                    </label>
                                    <textarea
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                        placeholder="Nhập ghi chú xử lý..."
                                        className="w-full px-3 py-2 input-field resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowExtensionModal(false)}
                                    >
                                        Đóng
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => showConfirmation('Bạn có chắc chắn muốn từ chối yêu cầu gia hạn này?', handleRejectExtension)}
                                        disabled={isProcessing}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Từ chối'}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleApproveExtension}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Duyệt'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Fine Modal */}
            <Modal
                isOpen={showFineModal}
                onClose={() => setShowFineModal(false)}
                title="Chi tiết phạt"
            >
                <div className="py-6">
                    {selectedFine && (
                        <div className="space-y-6">
                            {/* Fine Information */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Người bị phạt
                                        </label>
                                        <p className="text-dark-50">
                                            {selectedFine.userId?.fullName || 'Chưa có thông tin'}
                                        </p>
                                        <p className="text-sm text-dark-400">
                                            {selectedFine.userId?.email || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Trạng thái
                                        </label>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFine.status)}`}>
                                            {formatStatus(selectedFine.status)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Số tiền phạt
                                        </label>
                                        <p className="text-dark-50 text-lg font-semibold text-red-400">
                                            {selectedFine.amount?.toLocaleString('vi-VN')} {selectedFine.currency}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Loại phạt
                                        </label>
                                        <p className="text-dark-50">
                                            {selectedFine.type === 'LATE_RETURN' ? 'Trả muộn' :
                                                selectedFine.type === 'DAMAGE' ? 'Hư hỏng' :
                                                    selectedFine.type === 'LOSS' ? 'Mất sách' : selectedFine.type}
                                        </p>
                                    </div>
                                </div>

                                {selectedFine.description && (
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Mô tả
                                        </label>
                                        <p className="text-dark-50 bg-dark-700 px-3 py-2 rounded">
                                            {selectedFine.description}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Ngày tạo
                                        </label>
                                        <p className="text-dark-50">
                                            {new Date(selectedFine.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Hạn thanh toán
                                        </label>
                                        <p className="text-dark-50">
                                            {selectedFine.dueDate ? new Date(selectedFine.dueDate).toLocaleDateString('vi-VN') : 'Không có'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Section */}
                            <div className="border-t border-dark-600 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Lý do miễn phạt (nếu miễn)
                                    </label>
                                    <textarea
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                        placeholder="Nhập lý do miễn phạt..."
                                        className="w-full px-3 py-2 input-field resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowFineModal(false)}
                                    >
                                        Đóng
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => showConfirmation('Bạn có chắc chắn muốn miễn phạt này?', handleWaiveFine)}
                                        disabled={isProcessing}
                                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20"
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Miễn phạt'}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={() => showConfirmation('Bạn có chắc chắn muốn thanh toán phạt này?', handlePayFine)}
                                        disabled={isProcessing}
                                        className="bg-green-500 hover:bg-green-600 text-white"
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Return Modal */}
            <Modal
                isOpen={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                title="Trả sách"
            >
                <div className="py-6">
                    {selectedLoan && (
                        <div className="space-y-6">
                            {/* Loan Information */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Mã phiếu mượn
                                        </label>
                                        <p className="text-dark-50 font-mono text-sm bg-dark-700 px-3 py-2 rounded">
                                            {selectedLoan.code}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-dark-300 mb-1">
                                            Người mượn
                                        </label>
                                        <p className="text-dark-50">
                                            {selectedLoan.readerUserId?.fullName}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Danh sách sách trả
                                    </label>
                                    <div className="space-y-3">
                                        {selectedLoan.items?.map((item: any, index: number) => (
                                            <div key={index} className="p-4 bg-dark-700 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-dark-50">
                                                            {item.bookId?.title}
                                                        </h4>
                                                        <p className="text-sm text-dark-400">
                                                            Tác giả: {item.bookId?.authors?.join(', ')}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm text-dark-300">
                                                        Số lượng: {item.qty}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-dark-300 mb-2">
                                                            Tình trạng sách
                                                        </label>
                                                        <select
                                                            value={returnConditions[item.bookId._id]?.condition || 'GOOD'}
                                                            onChange={(e) => setReturnConditions(prev => ({
                                                                ...prev,
                                                                [item.bookId._id]: {
                                                                    ...prev[item.bookId._id],
                                                                    condition: e.target.value,
                                                                    damageLevel: e.target.value === 'DAMAGED' ? (prev[item.bookId._id]?.damageLevel || 10) : 0
                                                                }
                                                            }))}
                                                            className="w-full px-3 py-2 input-field"
                                                        >
                                                            <option value="GOOD">Tốt</option>
                                                            <option value="DAMAGED">Hư hỏng</option>
                                                            <option value="LOST">Mất sách</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-dark-300 mb-2">
                                                            Ghi chú
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={returnConditions[item.bookId._id]?.notes || ''}
                                                            onChange={(e) => setReturnConditions(prev => ({
                                                                ...prev,
                                                                [item.bookId._id]: {
                                                                    ...prev[item.bookId._id],
                                                                    notes: e.target.value
                                                                }
                                                            }))}
                                                            placeholder="Ghi chú về tình trạng sách..."
                                                            className="w-full px-3 py-2 input-field"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Damage Level Slider - Only show if condition is DAMAGED */}
                                                {returnConditions[item.bookId._id]?.condition === 'DAMAGED' && (
                                                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                        <label className="block text-sm font-medium text-red-400 mb-3">
                                                            Mức độ hư hỏng: {returnConditions[item.bookId._id]?.damageLevel || 10}%
                                                        </label>
                                                        <input
                                                            type="range"
                                                            min="10"
                                                            max="90"
                                                            step="10"
                                                            value={returnConditions[item.bookId._id]?.damageLevel || 10}
                                                            onChange={(e) => setReturnConditions(prev => ({
                                                                ...prev,
                                                                [item.bookId._id]: {
                                                                    ...prev[item.bookId._id],
                                                                    damageLevel: parseInt(e.target.value)
                                                                }
                                                            }))}
                                                            className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer slider"
                                                        />
                                                        <div className="flex justify-between text-xs text-red-300 mt-2">
                                                            <span>10% - Nhẹ</span>
                                                            <span>50% - Trung bình</span>
                                                            <span>90% - Nặng</span>
                                                        </div>
                                                        <div className="mt-2 text-sm text-red-300">
                                                            💰 Phạt dự kiến: {((returnConditions[item.bookId._id]?.damageLevel || 10) * (finePolicy?.damageFeeRate || 0.3) * 100).toFixed(0)}% giá trị sách
                                                            {item.bookId?.price && (
                                                                <span className="block text-xs text-red-400 mt-1">
                                                                    (Giá sách: {item.bookId.price.toLocaleString('vi-VN')} VND - Phạt: {Math.round(item.bookId.price * (finePolicy?.damageFeeRate || 0.3) * (returnConditions[item.bookId._id]?.damageLevel || 10) / 100).toLocaleString('vi-VN')} VND)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Lost Book Warning */}
                                                {returnConditions[item.bookId._id]?.condition === 'LOST' && (
                                                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                                                        <div className="flex items-center gap-2 text-red-400 font-medium">
                                                            <span className="text-lg">⚠️</span>
                                                            <span>Sách bị mất</span>
                                                        </div>
                                                        <div className="mt-2 text-sm text-red-300">
                                                            💰 Phạt: {(finePolicy?.lostBookFeeRate || 1.0) * 100}% giá trị sách
                                                            {item.bookId?.price && (
                                                                <span className="block text-xs text-red-400 mt-1">
                                                                    (Giá sách: {item.bookId.price.toLocaleString('vi-VN')} VND - Phạt: {Math.round(item.bookId.price * (finePolicy?.lostBookFeeRate || 1.0)).toLocaleString('vi-VN')} VND)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Section */}
                            <div className="border-t border-dark-600 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-dark-300 mb-2">
                                        Ghi chú trả sách (tùy chọn)
                                    </label>
                                    <textarea
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                        placeholder="Nhập ghi chú trả sách..."
                                        className="w-full px-3 py-2 input-field resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 justify-end mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowReturnModal(false)}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleReturnLoan}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'Đang xử lý...' : 'Xác nhận trả sách'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Confirmation Dialog */}
            <Modal
                isOpen={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                title="Xác nhận"
            >
                <div className="py-6">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <p className="text-lg text-dark-300 mb-6">
                            {confirmMessage}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="secondary"
                                onClick={() => setShowConfirmDialog(false)}
                            >
                                Hủy
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleConfirm}
                            >
                                Xác nhận
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LoanManagement;
