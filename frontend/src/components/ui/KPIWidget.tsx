import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPIWidgetProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
    loading?: boolean;
    className?: string;
}

const KPIWidget: React.FC<KPIWidgetProps> = ({
    title,
    value,
    change,
    changeLabel = 'Thay đổi',
    icon,
    color = 'primary',
    loading = false,
    className = '',
}) => {
    const getColorClasses = () => {
        switch (color) {
            case 'success':
                return {
                    bg: 'bg-green-500/20',
                    icon: 'text-green-400',
                    change: change && change > 0 ? 'text-green-400' : 'text-red-400',
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-500/20',
                    icon: 'text-yellow-400',
                    change: change && change > 0 ? 'text-green-400' : 'text-red-400',
                };
            case 'danger':
                return {
                    bg: 'bg-red-500/20',
                    icon: 'text-red-400',
                    change: change && change > 0 ? 'text-green-400' : 'text-red-400',
                };
            case 'info':
                return {
                    bg: 'bg-blue-500/20',
                    icon: 'text-blue-400',
                    change: change && change > 0 ? 'text-green-400' : 'text-red-400',
                };
            default:
                return {
                    bg: 'bg-primary-500/20',
                    icon: 'text-primary-400',
                    change: change && change > 0 ? 'text-green-400' : 'text-red-400',
                };
        }
    };

    const getTrendIcon = () => {
        if (change === undefined || change === 0) return <Minus className="w-4 h-4" />;
        return change > 0 ?
            <TrendingUp className="w-4 h-4" /> :
            <TrendingDown className="w-4 h-4" />;
    };

    const colors = getColorClasses();

    if (loading) {
        return (
            <motion.div
                className={`glass-card p-6 ${className}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-dark-800 rounded-xl" />
                        <div className="w-16 h-4 bg-dark-800 rounded" />
                    </div>
                    <div className="w-20 h-8 bg-dark-800 rounded mb-2" />
                    <div className="w-24 h-4 bg-dark-800 rounded" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={`glass-card p-6 ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -2 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                {icon && (
                    <div className={`p-3 rounded-xl ${colors.bg}`}>
                        <div className={colors.icon}>
                            {icon}
                        </div>
                    </div>
                )}

                {change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-medium ${colors.change}`}>
                        {getTrendIcon()}
                        <span>
                            {change > 0 ? '+' : ''}{change}%
                        </span>
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="mb-2">
                <h3 className="text-2xl font-bold text-dark-50">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </h3>
            </div>

            {/* Title */}
            <div>
                <p className="text-dark-300 text-sm font-medium">
                    {title}
                </p>
                {change !== undefined && changeLabel && (
                    <p className="text-xs text-dark-400 mt-1">
                        {changeLabel} so với kỳ trước
                    </p>
                )}
            </div>

            {/* Progress Bar (if change is provided) */}
            {change !== undefined && (
                <div className="mt-4">
                    <div className="w-full bg-dark-800 rounded-full h-1">
                        <motion.div
                            className={`h-1 rounded-full ${change > 0 ? 'bg-green-500' : change < 0 ? 'bg-red-500' : 'bg-gray-500'
                                }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(Math.abs(change), 100)}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default KPIWidget;
