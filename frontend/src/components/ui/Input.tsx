import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="block text-sm font-medium text-dark-200">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400">
                            {icon}
                        </div>
                    )}
                    <motion.input
                        ref={ref}
                        className={`input-field w-full ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
                        whileFocus={{ scale: 1.01 }}
                        {...(props as any)}
                    />
                </div>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-400"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
