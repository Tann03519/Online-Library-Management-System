import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, CartItem, CartContextType } from '../types';
import toast from 'react-hot-toast';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

interface CartProviderProps {
    children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const addItem = (book: Book, qty: number = 1) => {
        setItems(prev => {
            const existingItem = prev.find(item => item.bookId === book._id);

            if (existingItem) {
                const newQty = existingItem.qty + qty;
                if (newQty > book.quantityAvailable) {
                    toast.error(`Chỉ còn ${book.quantityAvailable} cuốn sách "${book.title}"`);
                    return prev;
                }

                const updated = prev.map(item =>
                    item.bookId === book._id
                        ? { ...item, qty: newQty }
                        : item
                );

                toast.success(`Đã thêm ${qty} cuốn "${book.title}" vào giỏ mượn`);
                return updated;
            } else {
                if (qty > book.quantityAvailable) {
                    toast.error(`Chỉ còn ${book.quantityAvailable} cuốn sách "${book.title}"`);
                    return prev;
                }

                toast.success(`Đã thêm "${book.title}" vào giỏ mượn`);
                return [...prev, { bookId: book._id, book, qty }];
            }
        });
    };

    const removeItem = (bookId: string) => {
        setItems(prev => {
            const item = prev.find(item => item.bookId === bookId);
            if (item) {
                toast.success(`Đã xóa "${item.book.title}" khỏi giỏ mượn`);
            }
            return prev.filter(item => item.bookId !== bookId);
        });
    };

    const updateQuantity = (bookId: string, qty: number) => {
        if (qty <= 0) {
            removeItem(bookId);
            return;
        }

        setItems(prev => {
            const item = prev.find(item => item.bookId === bookId);
            if (item && qty > item.book.quantityAvailable) {
                toast.error(`Chỉ còn ${item.book.quantityAvailable} cuốn sách "${item.book.title}"`);
                return prev;
            }

            return prev.map(item =>
                item.bookId === bookId
                    ? { ...item, qty }
                    : item
            );
        });
    };

    const clearCart = () => {
        setItems([]);
        toast.success('Đã xóa tất cả sách khỏi giỏ mượn');
    };

    const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

    const value = {
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
