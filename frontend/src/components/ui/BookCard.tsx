import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

interface BookCardProps {
    book: Book;
    onViewDetails?: (book: Book) => void;
    showActions?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({
    book,
    onViewDetails,
    showActions = true,
}) => {
    const { addItem } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Handle cover image URL
    const getCoverImageUrl = (coverImageUrl: string | undefined) => {
        if (!coverImageUrl) return '';

        if (coverImageUrl.startsWith('http')) {
            return coverImageUrl;
        } else {
            // Relative path from backend
            const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:2409';
            return `${baseUrl}${coverImageUrl.startsWith('/') ? '' : '/'}${coverImageUrl}`;
        }
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (book.quantityAvailable > 0) {
            addItem(book, 1);
        }
    };

    const handleViewDetails = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onViewDetails) {
            onViewDetails(book);
        } else {
            navigate(`/book/${book._id}`);
        }
    };

    const isAvailable = book.quantityAvailable > 0;
    const availabilityPercentage = (book.quantityAvailable / book.quantityTotal) * 100;

    return (
        <motion.div
            className="group relative glass-card p-4 card-hover cursor-pointer"
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleViewDetails}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Book Cover */}
            <div className="relative aspect-[2/3] mb-4 rounded-xl overflow-hidden">
                {book.coverImageUrl ? (
                    <img
                        src={getCoverImageUrl(book.coverImageUrl)}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center ${book.coverImageUrl ? 'hidden' : ''}`}>
                    <BookOpen className="w-12 h-12 text-primary-400" />
                </div>

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Action buttons on hover */}
                {showActions && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <motion.button
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleViewDetails}
                        >
                            <BookOpen className="w-4 h-4 text-white" />
                        </motion.button>

                        {isAuthenticated && isAvailable && (
                            <motion.button
                                className="p-2 bg-primary-500/80 backdrop-blur-sm rounded-full hover:bg-primary-500 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleAddToCart}
                            >
                                <ShoppingCart className="w-4 h-4 text-white" />
                            </motion.button>
                        )}
                    </div>
                )}

                {/* Status badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {book.createdAt && new Date(book.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                        <span className="px-2 py-1 text-xs font-medium bg-accent-500 text-white rounded-full">
                            Mới
                        </span>
                    )}
                    {book.quantityAvailable === 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                            Hết
                        </span>
                    )}
                </div>
            </div>

            {/* Book Info */}
            <div className="space-y-2">
                <h3 className="font-heading font-semibold text-dark-50 line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {book.title}
                </h3>

                <p className="text-sm text-dark-300 line-clamp-1">
                    {book.authors.join(', ')}
                </p>

                {/* Availability indicator */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-dark-400">
                        <span>Còn lại</span>
                        <span>{book.quantityAvailable}/{book.quantityTotal}</span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-1.5">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${availabilityPercentage > 50
                                ? 'bg-green-500'
                                : availabilityPercentage > 20
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                            style={{ width: `${availabilityPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Category */}
                {book.categoryId && (
                    <div className="flex items-center gap-1">
                        <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full">
                            {book.categoryId.name}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default BookCard;
