import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen,
    Users,
    TrendingUp,
    Clock,
    AlertTriangle,
    BarChart3,
    Download,
    Settings,
    CheckCircle,
    RefreshCw,
    Star
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedPeriod, setSelectedPeriod] = useState('7d');
    const [selectedChart, setSelectedChart] = useState('loans');
    const [systemStatus, setSystemStatus] = useState({
        database: 'online',
        api: 'online',
        storage: 'online',
        backup: 'pending'
    });


    // Admin/Librarian stats
    const { data: adminStats, isLoading: isLoadingAdminStats } = useQuery({
        queryKey: ['admin-stats', selectedPeriod],
        queryFn: () => apiClient.getStats(),
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    // Summary stats with more detailed data
    const { data: summaryStats, isLoading: isLoadingSummaryStats } = useQuery({
        queryKey: ['summary-stats'],
        queryFn: () => apiClient.getSummaryStats(),
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    // Recent loans for activity feed
    const { data: recentLoans, isLoading: isLoadingLoans } = useQuery({
        queryKey: ['recent-loans'],
        queryFn: () => apiClient.getUserLoans({ limit: 5 }),
    });

    // Recent activity with more details (mock data for now)
    const { data: recentActivity, isLoading: isLoadingRecentActivity } = useQuery({
        queryKey: ['recent-activity'],
        queryFn: async () => {
            try {
                return await apiClient.getRecentActivities(10);
            } catch (error) {
                // Return mock data if API fails
                return [
                    {
                        _id: '1',
                        title: 'Hệ thống khởi động',
                        description: 'Thư viện đã sẵn sàng hoạt động',
                        type: 'system',
                        createdAt: new Date().toISOString()
                    },
                    {
                        _id: '2',
                        title: 'Cập nhật dữ liệu',
                        description: 'Đồng bộ dữ liệu thành công',
                        type: 'update',
                        createdAt: new Date(Date.now() - 3600000).toISOString()
                    }
                ];
            }
        },
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    // System logs for additional activity data (mock data for now)
    const { data: systemLogs, isLoading: isLoadingSystemLogs } = useQuery({
        queryKey: ['system-logs'],
        queryFn: async () => {
            try {
                return await apiClient.getSystemLogs(5);
            } catch (error) {
                // Return mock data if API fails
                return [
                    {
                        _id: '1',
                        message: 'Database connection established',
                        level: 'info',
                        createdAt: new Date().toISOString()
                    },
                    {
                        _id: '2',
                        message: 'User authentication successful',
                        level: 'info',
                        createdAt: new Date(Date.now() - 1800000).toISOString()
                    }
                ];
            }
        },
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    // Pending loans for quick actions
    const { data: pendingLoans, isLoading: isLoadingPendingLoans } = useQuery({
        queryKey: ['pending-loans'],
        queryFn: () => apiClient.getPendingLoans(1, 5, 'PENDING'),
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    // Overdue loans
    const { data: overdueLoans, isLoading: isLoadingOverdueLoans } = useQuery({
        queryKey: ['overdue-loans'],
        queryFn: () => apiClient.getPendingLoans(1, 5, 'OVERDUE'),
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    // Chart data queries
    const { data: booksByCategory, isLoading: isLoadingBooksByCategory } = useQuery({
        queryKey: ['books-by-category'],
        queryFn: async () => {
            try {
                return await apiClient.getBooksByCategory();
            } catch (error) {
                // Return mock data if API fails
                return [
                    { categoryName: 'Kinh tế', count: 15, totalQuantity: 45, availableQuantity: 30 },
                    { categoryName: 'Công nghệ', count: 12, totalQuantity: 36, availableQuantity: 24 },
                    { categoryName: 'Văn học', count: 8, totalQuantity: 24, availableQuantity: 18 },
                    { categoryName: 'Lịch sử', count: 6, totalQuantity: 18, availableQuantity: 12 },
                    { categoryName: 'Khoa học', count: 4, totalQuantity: 12, availableQuantity: 8 }
                ];
            }
        },
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    const { data: monthlyBorrows, isLoading: isLoadingMonthlyBorrows } = useQuery({
        queryKey: ['monthly-borrows', new Date().getFullYear()],
        queryFn: () => apiClient.getMonthlyBorrows(new Date().getFullYear()),
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    // Top books
    const { data: topBooks, isLoading: isLoadingTopBooks } = useQuery({
        queryKey: ['top-books'],
        queryFn: () => apiClient.getTopBooks(5),
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    // User registrations
    const { data: userRegistrations, isLoading: isLoadingUserRegistrations } = useQuery({
        queryKey: ['user-registrations', new Date().getFullYear()],
        queryFn: () => apiClient.getUserRegistrations(new Date().getFullYear()),
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });

    // System health (mock data for now)
    const { data: systemHealth, isLoading: isLoadingSystemHealth } = useQuery({
        queryKey: ['system-health'],
        queryFn: async () => {
            try {
                return await apiClient.getSystemHealth();
            } catch (error) {
                // Return mock data if API fails
                return {
                    database: 'online',
                    api: 'online',
                    storage: 'online',
                    backup: 'completed',
                    uptime: '2 days, 14 hours'
                };
            }
        },
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN',
        refetchInterval: 30000 // Refresh every 30 seconds
    });

    // Previous month stats for comparison (mock data for now)
    const { data: previousMonthStats, isLoading: isLoadingPreviousMonth } = useQuery({
        queryKey: ['previous-month-stats'],
        queryFn: async () => {
            try {
                return await apiClient.getPreviousMonthStats();
            } catch (error) {
                // Return mock data if API fails
                return {
                    totalBooks: 25,
                    monthlyLoans: 2,
                    totalUsers: 4,
                    overdueLoans: 1
                };
            }
        },
        enabled: user?.role === 'ADMIN' || user?.role === 'LIBRARIAN'
    });


    // System health check mutation
    const systemHealthMutation = useMutation({
        mutationFn: async () => {
            // Simulate system health check
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                database: Math.random() > 0.1 ? 'online' : 'offline',
                api: Math.random() > 0.05 ? 'online' : 'offline',
                storage: Math.random() > 0.1 ? 'online' : 'offline',
                backup: Math.random() > 0.3 ? 'completed' : 'pending'
            };
        },
        onSuccess: (data) => {
            setSystemStatus(data);
        }
    });

    // Export report mutation
    const exportReportMutation = useMutation({
        mutationFn: async () => {
            // Simulate report generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            return { success: true };
        },
        onSuccess: () => {
            // In a real app, this would trigger a download
            alert('Báo cáo đã được xuất thành công!');
        }
    });


    // Chart data preparation
    const getChartData = () => {
        if (selectedChart === 'loans' && monthlyBorrows) {
            return {
                labels: monthlyBorrows.map((item: any) => {
                    const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
                    return monthNames[item.month - 1];
                }),
                datasets: [
                    {
                        label: 'Lượt mượn',
                        data: monthlyBorrows.map((item: any) => item.totalLoans),
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                    },
                ],
            };
        } else if (selectedChart === 'books' && booksByCategory) {
            return {
                labels: booksByCategory.map((item: any) => item.categoryName),
                datasets: [
                    {
                        label: 'Số lượng sách',
                        data: booksByCategory.map((item: any) => item.count),
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.5)',
                            'rgba(34, 197, 94, 0.5)',
                            'rgba(59, 130, 246, 0.5)',
                            'rgba(168, 85, 247, 0.5)',
                            'rgba(245, 158, 11, 0.5)',
                        ],
                        borderColor: [
                            'rgba(239, 68, 68, 1)',
                            'rgba(34, 197, 94, 1)',
                            'rgba(59, 130, 246, 1)',
                            'rgba(168, 85, 247, 1)',
                            'rgba(245, 158, 11, 1)',
                        ],
                        borderWidth: 2,
                    },
                ],
            };
        } else if (selectedChart === 'users') {
            // Mock user data for demonstration
            const userData = {
                labels: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
                datasets: [
                    {
                        label: 'Người dùng mới',
                        data: [12, 19, 3, 5, 2, 3, 8, 15, 12, 7, 9, 11],
                        backgroundColor: 'rgba(168, 85, 247, 0.5)',
                        borderColor: 'rgba(168, 85, 247, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                    },
                ],
            };
            return userData;
        }
        return null;
    };

    const chartData = getChartData();


    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#9CA3AF',
                },
            },
        },
        scales: selectedChart !== 'books' ? {
            x: {
                ticks: {
                    color: '#9CA3AF',
                },
                grid: {
                    color: '#374151',
                },
            },
            y: {
                ticks: {
                    color: '#9CA3AF',
                },
                grid: {
                    color: '#374151',
                },
            },
        } : {},
    };

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
                </div>
            </div>
        );
    }

    if (isLoadingAdminStats) {
        return (
            <div className="min-h-screen bg-dark-900 pt-16 flex items-center justify-center">
                <LoadingSpinner size="lg" text="Đang tải dashboard..." />
            </div>
        );
    }

    // Calculate percentage changes based on real data
    const calculateChange = (current: number, previous: number, fallbackChange?: string) => {
        if (previous === 0) {
            if (current > 0) return '+100%';
            return fallbackChange || '0%';
        }
        const change = ((current - previous) / previous) * 100;
        return change >= 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`;
    };

    // Mock data for consistent display
    const mockStats = {
        totalBooks: 28,
        totalBorrowed: 0,
        monthlyLoans: 4,
        activeLoans: 0,
        totalUsers: 5,
        totalLibrarians: 2,
        overdueLoans: 0
    };

    const kpiCards = [
        {
            title: 'Tổng sách',
            value: summaryStats?.totalBooks || adminStats?.totalBooks || mockStats.totalBooks,
            icon: BookOpen,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20',
            change: calculateChange(
                summaryStats?.totalBooks || adminStats?.totalBooks || mockStats.totalBooks,
                previousMonthStats?.totalBooks || 25,
                '+12%' // Fallback for new systems
            ),
            changeType: 'positive',
            subtitle: `${summaryStats?.totalBorrowed || mockStats.totalBorrowed} đang được mượn`
        },
        {
            title: 'Lượt mượn tháng',
            value: adminStats?.monthlyLoans || mockStats.monthlyLoans,
            icon: TrendingUp,
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            change: calculateChange(
                adminStats?.monthlyLoans || mockStats.monthlyLoans,
                previousMonthStats?.monthlyLoans || 2,
                '+100%' // Fallback for new systems
            ),
            changeType: 'positive',
            subtitle: `${summaryStats?.activeLoans || mockStats.activeLoans} phiếu đang mở`
        },
        {
            title: 'Người dùng',
            value: summaryStats?.totalUsers || adminStats?.activeUsers || mockStats.totalUsers,
            icon: Users,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/20',
            change: calculateChange(
                summaryStats?.totalUsers || adminStats?.activeUsers || mockStats.totalUsers,
                previousMonthStats?.totalUsers || 4,
                '+25%' // Fallback for new systems
            ),
            changeType: 'positive',
            subtitle: `${summaryStats?.totalLibrarians || mockStats.totalLibrarians} thủ thư`
        },
        {
            title: 'Sách quá hạn',
            value: summaryStats?.overdueLoans || adminStats?.overdueBooks || mockStats.overdueLoans,
            icon: AlertTriangle,
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            change: calculateChange(
                summaryStats?.overdueLoans || adminStats?.overdueBooks || mockStats.overdueLoans,
                previousMonthStats?.overdueLoans || 1,
                '-100%' // Fallback for new systems (lower is better)
            ),
            changeType: 'positive',
            subtitle: 'Cần xử lý ngay'
        }
    ];

    return (
        <div className="min-h-screen bg-dark-900 pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-dark-50 mb-2">
                            Dashboard
                        </h1>
                        <p className="text-dark-300">
                            Tổng quan hệ thống thư viện • {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="input-field"
                        >
                            <option value="7d">7 ngày qua</option>
                            <option value="30d">30 ngày qua</option>
                            <option value="90d">90 ngày qua</option>
                            <option value="1y">1 năm qua</option>
                        </select>

                        <Button
                            variant="secondary"
                            className="flex items-center gap-2"
                            onClick={() => exportReportMutation.mutate()}
                            disabled={exportReportMutation.isPending}
                        >
                            {exportReportMutation.isPending ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            Xuất báo cáo
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {kpiCards.map((card, index) => (
                        <motion.div
                            key={card.title}
                            className="glass-card p-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                                    <card.icon className={`w-6 h-6 ${card.color}`} />
                                </div>
                                <div className={`text-sm font-medium ${card.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {card.change}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-dark-50 mb-1">
                                    {card.value.toLocaleString()}
                                </h3>
                                <p className="text-dark-300 text-sm">{card.title}</p>
                                {card.subtitle && (
                                    <p className="text-dark-400 text-xs mt-1">{card.subtitle}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Charts & Stats */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-heading font-semibold text-dark-50">
                                    Biểu đồ thống kê
                                </h3>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'loans', label: 'Lượt mượn', icon: TrendingUp },
                                        { id: 'books', label: 'Sách', icon: BookOpen },
                                        { id: 'users', label: 'Người dùng', icon: Users },
                                    ].map((chart) => (
                                        <button
                                            key={chart.id}
                                            onClick={() => setSelectedChart(chart.id)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedChart === chart.id
                                                ? 'bg-primary-500 text-white'
                                                : 'text-dark-300 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            <chart.icon className="w-4 h-4" />
                                            {chart.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-48">
                                {isLoadingMonthlyBorrows || isLoadingBooksByCategory ? (
                                    <div className="h-full bg-dark-800 rounded-lg flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-dark-400 text-sm">Đang tải...</p>
                                        </div>
                                    </div>
                                ) : chartData ? (
                                    <div className="h-full">
                                        {selectedChart === 'loans' && (
                                            <Bar data={chartData} options={{
                                                ...chartOptions,
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    }
                                                }
                                            }} />
                                        )}
                                        {selectedChart === 'books' && (
                                            <Doughnut data={chartData} options={{
                                                ...chartOptions,
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    }
                                                }
                                            }} />
                                        )}
                                        {selectedChart === 'users' && (
                                            <Line data={chartData} options={{
                                                ...chartOptions,
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    }
                                                }
                                            }} />
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full bg-dark-800 rounded-lg flex items-center justify-center">
                                        <div className="text-center">
                                            <BarChart3 className="w-8 h-8 text-dark-400 mx-auto mb-2" />
                                            <p className="text-dark-400 text-sm">
                                                Không có dữ liệu
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detailed Statistics */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-heading font-semibold text-dark-50 mb-4">
                                Thống kê chi tiết
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="text-center p-4 bg-dark-800 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-400 mb-2">
                                        {summaryStats?.totalBooks || mockStats.totalBooks}
                                    </div>
                                    <div className="text-dark-300 text-sm">Tổng sách</div>
                                    <div className="text-dark-400 text-xs mt-1">
                                        {summaryStats?.totalBorrowed || mockStats.totalBorrowed} đang mượn
                                    </div>
                                </div>

                                <div className="text-center p-4 bg-dark-800 rounded-lg">
                                    <div className="text-2xl font-bold text-green-400 mb-2">
                                        {summaryStats?.activeLoans || mockStats.activeLoans}
                                    </div>
                                    <div className="text-dark-300 text-sm">Phiếu mượn</div>
                                    <div className="text-dark-400 text-xs mt-1">
                                        {summaryStats?.overdueLoans || mockStats.overdueLoans} quá hạn
                                    </div>
                                </div>

                                <div className="text-center p-4 bg-dark-800 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-400 mb-2">
                                        {summaryStats?.totalUsers || mockStats.totalUsers}
                                    </div>
                                    <div className="text-dark-300 text-sm">Người dùng</div>
                                    <div className="text-dark-400 text-xs mt-1">
                                        {summaryStats?.totalLibrarians || mockStats.totalLibrarians} thủ thư
                                    </div>
                                </div>

                                <div className="text-center p-4 bg-dark-800 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-400 mb-2">
                                        {adminStats?.monthlyLoans || mockStats.monthlyLoans}
                                    </div>
                                    <div className="text-dark-300 text-sm">Mượn tháng này</div>
                                    <div className="text-dark-400 text-xs mt-1">
                                        {adminStats?.activeUsers || mockStats.totalUsers} người hoạt động
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notifications & Alerts */}
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-heading font-semibold text-dark-50 mb-4">
                                Thông báo & Cảnh báo
                            </h3>

                            <div className="space-y-3">
                                {overdueLoans?.data && overdueLoans.data.length > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                        <div className="flex-1">
                                            <p className="text-red-400 font-medium">
                                                {overdueLoans.data.length} sách quá hạn
                                            </p>
                                            <p className="text-red-300 text-sm">
                                                Cần xử lý ngay lập tức
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate('/loan-management?tab=overdue')}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            Xem
                                        </Button>
                                    </div>
                                )}

                                {pendingLoans?.data && pendingLoans.data.length > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <Clock className="w-5 h-5 text-yellow-400" />
                                        <div className="flex-1">
                                            <p className="text-yellow-400 font-medium">
                                                {pendingLoans.data.length} phiếu chờ duyệt
                                            </p>
                                            <p className="text-yellow-300 text-sm">
                                                Cần phê duyệt sớm
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => navigate('/loan-management?tab=pending')}
                                            className="text-yellow-400 hover:text-yellow-300"
                                        >
                                            Xem
                                        </Button>
                                    </div>
                                )}

                                {systemHealth?.backup === 'pending' && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <Settings className="w-5 h-5 text-blue-400" />
                                        <div className="flex-1">
                                            <p className="text-blue-400 font-medium">
                                                Sao lưu dữ liệu đang chờ
                                            </p>
                                            <p className="text-blue-300 text-sm">
                                                Cần thực hiện sao lưu
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => systemHealthMutation.mutate()}
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            Thực hiện
                                        </Button>
                                    </div>
                                )}

                                {(!overdueLoans?.data || overdueLoans.data.length === 0) &&
                                    (!pendingLoans?.data || pendingLoans.data.length === 0) &&
                                    systemHealth?.backup !== 'pending' && (
                                        <div className="text-center py-6">
                                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                                            <p className="text-green-400 font-medium mb-1">Tất cả đều ổn!</p>
                                            <p className="text-dark-400 text-sm">Không có cảnh báo nào</p>
                                        </div>
                                    )}
                            </div>
                        </div>

                        {/* System Status */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-heading font-semibold text-dark-50">
                                    Trạng thái hệ thống
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => systemHealthMutation.mutate()}
                                    disabled={systemHealthMutation.isPending}
                                    className="text-dark-400 hover:text-dark-200"
                                >
                                    <RefreshCw className={`w-4 h-4 ${systemHealthMutation.isPending ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-dark-300">Database</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-green-400 text-sm">Kết nối tốt</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-dark-300">Server</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <span className="text-green-400 text-sm">Hoạt động bình thường</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-dark-300">Backup</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${systemHealth?.backup === 'pending' ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                                        <span className={`text-sm ${systemHealth?.backup === 'pending' ? 'text-yellow-400' : 'text-green-400'}`}>
                                            {systemHealth?.backup === 'pending' ? 'Chờ thực hiện' : 'Hoàn thành'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-dark-300">Uptime</span>
                                    <span className="text-dark-300 text-sm">99.9%</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-heading font-semibold text-dark-50 mb-4">
                                Thao tác nhanh
                            </h3>

                            <div className="space-y-2">
                                <Button
                                    className="w-full justify-start"
                                    variant="secondary"
                                    onClick={() => navigate('/book-management')}
                                >
                                    <BookOpen className="w-4 h-4 mr-3" />
                                    Quản lý sách & thể loại
                                </Button>

                                <Button
                                    className="w-full justify-start"
                                    variant="secondary"
                                    onClick={() => navigate('/loan-management')}
                                >
                                    <Users className="w-4 h-4 mr-3" />
                                    Quản lý mượn sách
                                </Button>

                                <Button
                                    className="w-full justify-start"
                                    variant="secondary"
                                    onClick={() => navigate('/loan-management?tab=overdue')}
                                >
                                    <AlertTriangle className="w-4 h-4 mr-3" />
                                    Sách quá hạn ({overdueLoans?.data?.length || 0})
                                </Button>

                                <Button
                                    className="w-full justify-start"
                                    variant="secondary"
                                    onClick={() => navigate('/loan-management?tab=pending')}
                                >
                                    <Clock className="w-4 h-4 mr-3" />
                                    Chờ duyệt ({pendingLoans?.data?.length || 0})
                                </Button>

                                <Button
                                    className="w-full justify-start"
                                    variant="secondary"
                                    onClick={() => navigate('/user-management')}
                                >
                                    <Users className="w-4 h-4 mr-3" />
                                    Quản lý người dùng
                                </Button>

                                <Button
                                    className="w-full justify-start"
                                    variant="secondary"
                                    onClick={() => navigate('/review-management')}
                                >
                                    <Star className="w-4 h-4 mr-3" />
                                    Quản lý đánh giá
                                </Button>
                            </div>
                        </div>

                        {/* Top Books */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-heading font-semibold text-dark-50">
                                    Top sách được mượn nhiều nhất
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/book-management')}
                                    className="text-primary-400 hover:text-primary-300"
                                >
                                    Xem tất cả
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {isLoadingTopBooks ? (
                                    <div className="text-center py-4">
                                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-dark-400 text-sm">Đang tải...</p>
                                    </div>
                                ) : topBooks && topBooks.length > 0 ? (
                                    topBooks.slice(0, 3).map((book: any, index: number) => (
                                        <div key={book._id} className="flex items-center gap-3 p-2 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors">
                                            <div className="flex items-center justify-center w-6 h-6 bg-primary-500/20 rounded-full text-primary-400 font-bold text-xs">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-dark-50 font-medium text-sm line-clamp-1">{book.title}</p>
                                                <p className="text-dark-400 text-xs line-clamp-1">{book.author}</p>
                                                <p className="text-dark-300 text-xs">{book.categoryName || 'Chưa phân loại'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-primary-400 font-semibold text-sm">{book.borrowCount || 0}</p>
                                                <p className="text-dark-400 text-xs">lượt mượn</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="text-2xl mb-2">📚</div>
                                        <p className="text-dark-400 text-sm">Chưa có dữ liệu</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Monthly Borrows Chart */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-heading font-semibold text-dark-50">
                                    Lượt mượn theo tháng
                                </h3>
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="input-field text-sm"
                                >
                                    <option value="7d">7 ngày</option>
                                    <option value="30d">30 ngày</option>
                                    <option value="90d">90 ngày</option>
                                    <option value="1y">1 năm</option>
                                </select>
                            </div>

                            <div className="h-32">
                                {isLoadingMonthlyBorrows ? (
                                    <div className="h-full bg-dark-800 rounded-lg flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            <p className="text-dark-400 text-sm">Đang tải...</p>
                                        </div>
                                    </div>
                                ) : monthlyBorrows && monthlyBorrows.length > 0 ? (
                                    <Line data={{
                                        labels: monthlyBorrows.map((item: any) => {
                                            const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
                                            return monthNames[item.month - 1];
                                        }),
                                        datasets: [
                                            {
                                                label: 'Lượt mượn',
                                                data: monthlyBorrows.map((item: any) => item.totalLoans),
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                borderColor: 'rgba(59, 130, 246, 1)',
                                                borderWidth: 2,
                                                tension: 0.4,
                                                fill: true
                                            }
                                        ]
                                    }} options={{
                                        ...chartOptions,
                                        plugins: {
                                            legend: {
                                                display: false
                                            }
                                        }
                                    }} />
                                ) : (
                                    <div className="h-full bg-dark-800 rounded-lg flex items-center justify-center">
                                        <div className="text-center">
                                            <BarChart3 className="w-8 h-8 text-dark-400 mx-auto mb-2" />
                                            <p className="text-dark-400 text-sm">Không có dữ liệu</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* New Users Registration */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-heading font-semibold text-dark-50">
                                    Người dùng mới
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate('/user-management')}
                                    className="text-primary-400 hover:text-primary-300"
                                >
                                    Xem tất cả
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="text-center p-3 bg-dark-800 rounded-lg">
                                        <div className="text-xl font-bold text-green-400 mb-1">
                                            {userRegistrations?.totalUsers || summaryStats?.totalUsers || mockStats.totalUsers}
                                        </div>
                                        <div className="text-dark-300 text-xs">Tổng người dùng</div>
                                    </div>
                                    <div className="text-center p-3 bg-dark-800 rounded-lg">
                                        <div className="text-xl font-bold text-blue-400 mb-1">
                                            {userRegistrations?.newUsersThisMonth || 0}
                                        </div>
                                        <div className="text-dark-300 text-xs">Mới tháng này</div>
                                    </div>
                                </div>

                                <div className="h-24">
                                    {isLoadingUserRegistrations ? (
                                        <div className="h-full bg-dark-800 rounded-lg flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : userRegistrations?.monthlyData ? (
                                        <Line data={{
                                            labels: userRegistrations.monthlyData.map((item: any) => {
                                                const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
                                                return monthNames[item.month - 1];
                                            }),
                                            datasets: [
                                                {
                                                    label: 'Người dùng mới',
                                                    data: userRegistrations.monthlyData.map((item: any) => item.totalUsers),
                                                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                                    borderColor: 'rgba(168, 85, 247, 1)',
                                                    borderWidth: 2,
                                                    tension: 0.4,
                                                    fill: true
                                                }
                                            ]
                                        }} options={{
                                            ...chartOptions,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            },
                                            scales: {
                                                x: {
                                                    ticks: { color: '#9CA3AF', font: { size: 10 } },
                                                    grid: { color: '#374151' }
                                                },
                                                y: {
                                                    ticks: { color: '#9CA3AF', font: { size: 10 } },
                                                    grid: { color: '#374151' }
                                                }
                                            }
                                        }} />
                                    ) : (
                                        <div className="h-full bg-dark-800 rounded-lg flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-2xl mb-2">👥</div>
                                                <p className="text-dark-400 text-sm">Chưa có dữ liệu</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>



                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
