import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronUp,
    ChevronDown,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Search,
    Filter
} from 'lucide-react';

export interface Column<T> {
    key: keyof T;
    title: string;
    sortable?: boolean;
    render?: (value: any, item: T) => React.ReactNode;
    width?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    loading?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onView?: (item: T) => void;
    emptyMessage?: string;
    className?: string;
}

const DataTable = <T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    searchable = false,
    searchPlaceholder = 'Tìm kiếm...',
    onSearch,
    onEdit,
    onDelete,
    onView,
    emptyMessage = 'Không có dữ liệu',
    className = '',
}: DataTableProps<T>) => {
    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [showActions, setShowActions] = useState<Record<string, boolean>>({});

    const handleSort = (key: keyof T) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (onSearch) {
            onSearch(query);
        }
    };

    const filteredData = data.filter((item) => {
        if (!searchQuery) return true;

        return columns.some((column) => {
            const value = item[column.key];
            return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        });
    });

    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortKey) return 0;

        const aValue = a[sortKey];
        const bValue = b[sortKey];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleActions = (id: string) => {
        setShowActions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (loading) {
        return (
            <div className={`glass-card p-8 ${className}`}>
                <div className="animate-pulse space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-4 bg-dark-800 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`glass-card overflow-hidden ${className}`}>
            {/* Header */}
            {(searchable || onSearch) && (
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-dark-50 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 text-dark-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Filter className="w-4 h-4" />
                            Bộ lọc
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-dark-800/50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className={`px-6 py-4 text-left text-sm font-medium text-dark-300 ${column.sortable ? 'cursor-pointer hover:text-white' : ''
                                        }`}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && handleSort(column.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.title}
                                        {column.sortable && (
                                            <div className="flex flex-col">
                                                <ChevronUp
                                                    className={`w-3 h-3 ${sortKey === column.key && sortDirection === 'asc'
                                                            ? 'text-primary-400'
                                                            : 'text-dark-500'
                                                        }`}
                                                />
                                                <ChevronDown
                                                    className={`w-3 h-3 -mt-1 ${sortKey === column.key && sortDirection === 'desc'
                                                            ? 'text-primary-400'
                                                            : 'text-dark-500'
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                            {(onEdit || onDelete || onView) && (
                                <th className="px-6 py-4 text-right text-sm font-medium text-dark-300 w-20">
                                    Thao tác
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {sortedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)}
                                    className="px-6 py-12 text-center text-dark-400"
                                >
                                    <div className="text-4xl mb-4">📊</div>
                                    <p>{emptyMessage}</p>
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((item, index) => (
                                <motion.tr
                                    key={item.id || index}
                                    className="hover:bg-white/5 transition-colors"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={String(column.key)}
                                            className="px-6 py-4 text-sm text-dark-300"
                                        >
                                            {column.render
                                                ? column.render(item[column.key], item)
                                                : String(item[column.key] || '-')
                                            }
                                        </td>
                                    ))}
                                    {(onEdit || onDelete || onView) && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative">
                                                <button
                                                    onClick={() => toggleActions(item.id || index)}
                                                    className="p-2 text-dark-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>

                                                {showActions[item.id || index] && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute right-0 top-full mt-1 w-48 glass-card border border-white/10 rounded-lg shadow-lg z-10"
                                                    >
                                                        <div className="py-2">
                                                            {onView && (
                                                                <button
                                                                    onClick={() => {
                                                                        onView(item);
                                                                        toggleActions(item.id || index);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-dark-300 hover:text-white hover:bg-white/5 transition-colors"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    Xem chi tiết
                                                                </button>
                                                            )}
                                                            {onEdit && (
                                                                <button
                                                                    onClick={() => {
                                                                        onEdit(item);
                                                                        toggleActions(item.id || index);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-dark-300 hover:text-white hover:bg-white/5 transition-colors"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Chỉnh sửa
                                                                </button>
                                                            )}
                                                            {onDelete && (
                                                                <button
                                                                    onClick={() => {
                                                                        onDelete(item);
                                                                        toggleActions(item.id || index);
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Xóa
                                                                </button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
