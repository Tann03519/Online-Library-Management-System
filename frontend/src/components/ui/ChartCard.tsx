import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface ChartCardProps {
    title: string;
    data: any[];
    type?: 'line' | 'bar' | 'pie' | 'area';
    height?: number;
    showTrend?: boolean;
    trendValue?: number;
    trendLabel?: string;
    className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
    title,
    data,
    type = 'bar',
    height = 200,
    showTrend = false,
    trendValue = 0,
    trendLabel = 'Thay đổi',
    className = '',
}) => {
    const getTrendIcon = () => {
        if (trendValue > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
        if (trendValue < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
        return <Activity className="w-4 h-4 text-gray-400" />;
    };

    const getTrendColor = () => {
        if (trendValue > 0) return 'text-green-400';
        if (trendValue < 0) return 'text-red-400';
        return 'text-gray-400';
    };

    return (
        <motion.div
            className={`glass-card p-6 ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-heading font-semibold text-dark-50">
                    {title}
                </h3>

                {showTrend && (
                    <div className="flex items-center gap-2">
                        {getTrendIcon()}
                        <span className={`text-sm font-medium ${getTrendColor()}`}>
                            {trendValue > 0 ? '+' : ''}{trendValue}%
                        </span>
                        <span className="text-xs text-dark-400">{trendLabel}</span>
                    </div>
                )}
            </div>

            {/* Chart Placeholder */}
            <div
                className="relative bg-dark-800 rounded-lg flex items-center justify-center"
                style={{ height: `${height}px` }}
            >
                <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-dark-400 mx-auto mb-4" />
                    <p className="text-dark-400 text-sm">
                        {type === 'line' ? 'Biểu đồ đường' :
                            type === 'bar' ? 'Biểu đồ cột' :
                                type === 'pie' ? 'Biểu đồ tròn' :
                                    'Biểu đồ vùng'}
                    </p>
                    <p className="text-xs text-dark-500 mt-2">
                        Tích hợp Chart.js hoặc Recharts
                    </p>
                </div>

                {/* Mock Data Visualization */}
                <div className="absolute inset-4 flex items-end justify-center gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="bg-gradient-to-t from-primary-500 to-accent-500 rounded-t"
                            style={{
                                width: '12px',
                                height: `${Math.random() * 80 + 20}px`,
                            }}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.random() * 80 + 20}px` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                        />
                    ))}
                </div>
            </div>

            {/* Data Summary */}
            {data.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-dark-400">Tổng:</span>
                            <span className="ml-2 text-dark-50 font-medium">
                                {data.reduce((sum, item) => sum + (item.value || 0), 0).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-dark-400">Trung bình:</span>
                            <span className="ml-2 text-dark-50 font-medium">
                                {Math.round(data.reduce((sum, item) => sum + (item.value || 0), 0) / data.length).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default ChartCard;
