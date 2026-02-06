import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
    id,
    type,
    title,
    message,
    duration = 5000,
    onClose,
}) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertCircle,
        info: Info,
    };

    const colors = {
        success: 'text-green-400 bg-green-500/20 border-green-500/30',
        error: 'text-red-400 bg-red-500/20 border-red-500/30',
        warning: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
        info: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    };

    const Icon = icons[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`glass-card p-4 border-l-4 ${colors[type]} max-w-sm w-full`}
        >
            <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-dark-50 text-sm">
                        {title}
                    </h4>
                    {message && (
                        <p className="text-dark-300 text-sm mt-1 line-clamp-2">
                            {message}
                        </p>
                    )}
                </div>

                <button
                    onClick={() => onClose(id)}
                    className="flex-shrink-0 text-dark-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

export default Toast;
