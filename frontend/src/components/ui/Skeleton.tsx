import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'shimmer';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height,
    animation = 'shimmer',
}) => {
    const baseClasses = 'skeleton';

    const variantClasses = {
        text: 'h-4 rounded',
        rectangular: 'rounded-lg',
        circular: 'rounded-full',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-pulse',
        shimmer: 'shimmer',
    };

    const style = {
        width: width || '100%',
        height: height || '1rem',
    };

    return (
        <motion.div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
};

// Predefined skeleton components
export const BookCardSkeleton: React.FC = () => (
    <div className="glass-card p-4 space-y-4">
        <Skeleton variant="rectangular" height="200px" className="rounded-xl" />
        <div className="space-y-2">
            <Skeleton variant="text" height="20px" width="80%" />
            <Skeleton variant="text" height="16px" width="60%" />
            <Skeleton variant="text" height="12px" width="40%" />
        </div>
    </div>
);

export const BookListSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
            <BookCardSkeleton key={index} />
        ))}
    </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 4,
}) => (
    <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex space-x-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton
                        key={colIndex}
                        variant="text"
                        height="20px"
                        width={`${Math.random() * 40 + 60}%`}
                    />
                ))}
            </div>
        ))}
    </div>
);

export default Skeleton;
