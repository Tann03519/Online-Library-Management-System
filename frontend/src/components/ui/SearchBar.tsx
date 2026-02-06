import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
    placeholder?: string;
    className?: string;
    showClearButton?: boolean;
    onSearch?: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = 'Tìm theo tên, ISBN, tác giả...',
    className = '',
    showClearButton = true,
    onSearch,
}) => {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            if (onSearch) {
                onSearch(query.trim());
            } else {
                navigate(`/catalog?q=${encodeURIComponent(query.trim())}`);
            }
            setQuery('');
        }
    };

    const handleClear = () => {
        setQuery('');
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className={`relative ${className}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400">
                    <Search className="w-5 h-5" />
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-dark-50 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300"
                />

                {showClearButton && query && (
                    <motion.button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <X className="w-4 h-4" />
                    </motion.button>
                )}
            </div>
        </motion.form>
    );
};

export default SearchBar;
