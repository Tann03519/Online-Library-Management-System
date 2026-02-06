import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, RotateCcw } from 'lucide-react';
import Button from './Button';

interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

interface FilterGroup {
    title: string;
    key: string;
    type: 'checkbox' | 'radio' | 'range' | 'select';
    options?: FilterOption[];
    min?: number;
    max?: number;
    step?: number;
}

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterGroup[];
    values: Record<string, any>;
    onChange: (key: string, value: any) => void;
    onReset: () => void;
    onApply: () => void;
    className?: string;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
    isOpen,
    onClose,
    filters,
    values,
    onChange,
    onReset,
    onApply,
    className = '',
}) => {
    const renderFilterInput = (filter: FilterGroup) => {
        const currentValue = values[filter.key];

        switch (filter.type) {
            case 'checkbox':
                return (
                    <div className="space-y-3">
                        {filter.options?.map((option) => (
                            <label
                                key={option.value}
                                className="flex items-center justify-between cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={Array.isArray(currentValue) && currentValue.includes(option.value)}
                                        onChange={(e) => {
                                            const newValue = Array.isArray(currentValue) ? [...currentValue] : [];
                                            if (e.target.checked) {
                                                newValue.push(option.value);
                                            } else {
                                                const index = newValue.indexOf(option.value);
                                                if (index > -1) {
                                                    newValue.splice(index, 1);
                                                }
                                            }
                                            onChange(filter.key, newValue);
                                        }}
                                        className="w-4 h-4 text-primary-500 bg-white/5 border-white/20 rounded focus:ring-primary-500/50 focus:ring-2"
                                    />
                                    <span className="text-dark-300 text-sm">{option.label}</span>
                                </div>
                                {option.count !== undefined && (
                                    <span className="text-dark-400 text-xs">
                                        ({option.count})
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                );

            case 'radio':
                return (
                    <div className="space-y-3">
                        {filter.options?.map((option) => (
                            <label
                                key={option.value}
                                className="flex items-center justify-between cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name={filter.key}
                                        value={option.value}
                                        checked={currentValue === option.value}
                                        onChange={(e) => onChange(filter.key, e.target.value)}
                                        className="w-4 h-4 text-primary-500 bg-white/5 border-white/20 focus:ring-primary-500/50 focus:ring-2"
                                    />
                                    <span className="text-dark-300 text-sm">{option.label}</span>
                                </div>
                                {option.count !== undefined && (
                                    <span className="text-dark-400 text-xs">
                                        ({option.count})
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                );

            case 'range':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-dark-400 mb-1">
                                    Từ {filter.min}
                                </label>
                                <input
                                    type="number"
                                    min={filter.min}
                                    max={filter.max}
                                    step={filter.step}
                                    value={currentValue?.min || filter.min}
                                    onChange={(e) => onChange(filter.key, {
                                        ...currentValue,
                                        min: parseInt(e.target.value) || filter.min
                                    })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-dark-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-dark-400 mb-1">
                                    Đến {filter.max}
                                </label>
                                <input
                                    type="number"
                                    min={filter.min}
                                    max={filter.max}
                                    step={filter.step}
                                    value={currentValue?.max || filter.max}
                                    onChange={(e) => onChange(filter.key, {
                                        ...currentValue,
                                        max: parseInt(e.target.value) || filter.max
                                    })}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-dark-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                />
                            </div>
                        </div>
                        <div className="text-xs text-dark-400">
                            Khoảng: {currentValue?.min || filter.min} - {currentValue?.max || filter.max}
                        </div>
                    </div>
                );

            case 'select':
                return (
                    <select
                        value={currentValue || ''}
                        onChange={(e) => onChange(filter.key, e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-dark-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                        <option value="">Tất cả</option>
                        {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label} {option.count !== undefined ? `(${option.count})` : ''}
                            </option>
                        ))}
                    </select>
                );

            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed top-0 right-0 h-full w-full max-w-md bg-dark-900 border-l border-white/10 z-50 ${className}`}
                    >
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <Filter className="w-5 h-5 text-primary-400" />
                                    <h2 className="text-lg font-heading font-semibold text-dark-50">
                                        Bộ lọc
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-dark-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-8">
                                    {filters.map((filter) => (
                                        <div key={filter.key}>
                                            <h3 className="text-sm font-semibold text-dark-50 mb-4">
                                                {filter.title}
                                            </h3>
                                            {renderFilterInput(filter)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/10 space-y-3">
                                <div className="flex gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={onReset}
                                        className="flex-1 flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Đặt lại
                                    </Button>
                                    <Button
                                        onClick={onApply}
                                        className="flex-1"
                                    >
                                        Áp dụng
                                    </Button>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="w-full"
                                >
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FilterDrawer;
