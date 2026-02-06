import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, AlertCircle } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    variant?: 'default' | 'search' | 'error';
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    variant = 'default',
}) => {
    const getDefaultIcon = () => {
        switch (variant) {
            case 'search':
                return <Search className="w-16 h-16 text-dark-400" />;
            case 'error':
                return <AlertCircle className="w-16 h-16 text-red-400" />;
            default:
                return <BookOpen className="w-16 h-16 text-dark-400" />;
        }
    };

    return (
        <motion.div
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="mb-6"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
                {icon || getDefaultIcon()}
            </motion.div>

            <motion.h3
                className="text-xl font-heading font-semibold text-dark-300 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {title}
            </motion.h3>

            <motion.p
                className="text-dark-400 mb-6 max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                {description}
            </motion.p>

            {action && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Button onClick={action.onClick}>
                        {action.label}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
};

export default EmptyState;
