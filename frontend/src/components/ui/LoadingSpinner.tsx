import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    className = '',
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
                <Loader2 className={`${sizeClasses[size]} text-primary-500`} />
            </motion.div>
            {text && (
                <motion.p
                    className="mt-2 text-sm text-dark-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
};

export default LoadingSpinner;
