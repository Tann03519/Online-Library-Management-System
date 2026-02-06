import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Grid, List, SortAsc, SortDesc, ChevronDown, Star, Clock, TrendingUp, BookOpen, Eye, Heart, Bookmark, Share2, RefreshCw } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { Book, BookFilters } from '../types';
import BookCard from '../components/ui/BookCard';
import { BookListSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

const Catalog: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        const saved = localStorage.getItem('catalog-view-mode');
        return (saved as 'grid' | 'list') || 'grid';
    });
    const [sortBy, setSortBy] = useState<string>(() => {
        const saved = localStorage.getItem('catalog-sort-by');
        return saved || 'newest';
    });
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [yearRange, setYearRange] = useState<{ min: number, max: number }>({ min: 0, max: 0 });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const { isAuthenticated } = useAuth();
    const { addItem, items: cartItems } = useCart();

    // Filter states
    const [filters, setFilters] = useState<BookFilters>(() => {
        const saved = localStorage.getItem('catalog-filters');
        const categorySlug = searchParams.get('category');
        const categoryName = searchParams.get('categoryName');

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    q: searchParams.get('q') || parsed.q || '',
                    categoryId: searchParams.get('categoryId') || parsed.categoryId || '',
                    categorySlug: categorySlug || parsed.categorySlug || '',
                    categoryName: categoryName || parsed.categoryName || '',
                    publisherId: searchParams.get('publisherId') || parsed.publisherId || '',
                    facultyId: searchParams.get('facultyId') || parsed.facultyId || '',
                    departmentId: searchParams.get('departmentId') || parsed.departmentId || '',
                    year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : parsed.year || undefined,
                    page: 1,
                    limit: parsed.limit || 12,
                };
            } catch {
                // Fallback to default
            }
        }
        return {
            q: searchParams.get('q') || '',
            categoryId: searchParams.get('categoryId') || '',
            categorySlug: categorySlug || '',
            categoryName: categoryName || '',
            publisherId: searchParams.get('publisherId') || '',
            facultyId: searchParams.get('facultyId') || '',
            departmentId: searchParams.get('departmentId') || '',
            year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
            page: 1,
            limit: 12,
        };
    });

    // Fetch categories first
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => apiClient.getCategories(),
    });

    // Find categoryId from categorySlug
    const categoryId = useMemo(() => {
        if (filters.categorySlug && categories) {
            const category = categories.find(c => c.slug === filters.categorySlug);
            return category?._id || '';
        }
        return filters.categoryId || '';
    }, [filters.categorySlug, filters.categoryId, categories]);

    // Fetch data
    const { data: booksData, isLoading, error } = useQuery({
        queryKey: ['books', { ...filters, categoryId }],
        queryFn: () => apiClient.getBooks({ ...filters, categoryId }),
    });

    const { data: publishers } = useQuery({
        queryKey: ['publishers'],
        queryFn: () => apiClient.getPublishers(),
    });

    const { data: faculties } = useQuery({
        queryKey: ['faculties'],
        queryFn: () => apiClient.getFaculties(),
    });

    const { data: departments } = useQuery({
        queryKey: ['departments', filters.facultyId],
        queryFn: () => apiClient.getDepartments(filters.facultyId),
        enabled: !!filters.facultyId,
    });

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== '') {
                params.set(key, value.toString());
            }
        });
        setSearchParams(params);
    }, [filters, setSearchParams]);

    // Save view mode and sort preferences
    useEffect(() => {
        localStorage.setItem('catalog-view-mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('catalog-sort-by', sortBy);
    }, [sortBy]);

    // Save filter preferences (excluding page)
    useEffect(() => {
        const { page, ...filtersToSave } = filters;
        localStorage.setItem('catalog-filters', JSON.stringify(filtersToSave));
    }, [filters]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isSortOpen && !(event.target as Element).closest('.sort-dropdown')) {
                setIsSortOpen(false);
            }
            if (showSearchSuggestions && !(event.target as Element).closest('.search-container')) {
                setShowSearchSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSortOpen, showSearchSuggestions]);


    const handleFilterChange = useCallback((key: keyof BookFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1, // Reset to first page when filters change
        }));
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setFilters(prev => ({
            ...prev,
            page: page,
        }));
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            // Refetch all queries
            await Promise.all([
                // Add refetch for all queries here
            ]);
            toast.success('Đã làm mới dữ liệu');
        } catch (error) {
            console.error('Refresh error:', error);
            toast.error('Có lỗi khi làm mới dữ liệu');
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    const handleSelectBook = useCallback((bookId: string) => {
        setSelectedBooks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(bookId)) {
                newSet.delete(bookId);
            } else {
                newSet.add(bookId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback((books: Book[]) => {
        if (selectedBooks.size === books.length) {
            setSelectedBooks(new Set());
        } else {
            setSelectedBooks(new Set(books.map(book => book._id)));
        }
    }, [selectedBooks.size]);

    const handleBulkAddToCart = useCallback((books: Book[]) => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để mượn sách');
            return;
        }

        const booksToAdd = books.filter(book => selectedBooks.has(book._id));
        let addedCount = 0;

        booksToAdd.forEach(book => {
            if (book.quantityAvailable > 0) {
                const existingCartItem = cartItems.find(item => item.bookId === book._id);
                if (!existingCartItem || existingCartItem.qty < book.quantityAvailable) {
                    addItem(book, 1);
                    addedCount++;
                }
            }
        });

        if (addedCount > 0) {
            toast.success(`Đã thêm ${addedCount} cuốn sách vào giỏ mượn`);
            setSelectedBooks(new Set());
            setShowBulkActions(false);
        } else {
            toast.error('Không có sách nào có thể thêm vào giỏ mượn');
        }
    }, [isAuthenticated, selectedBooks, cartItems, addItem]);

    const handleBookAction = useCallback((action: string, book: Book) => {
        switch (action) {
            case 'view':
                navigate(`/book/${book._id}`);
                break;
            case 'favorite':
                // Add to favorites logic
                toast.success('Đã thêm vào danh sách yêu thích');
                break;
            case 'share':
                if (navigator.share) {
                    navigator.share({
                        title: book.title,
                        text: `Xem cuốn sách "${book.title}" tại thư viện`,
                        url: window.location.origin + `/book/${book._id}`
                    });
                } else {
                    navigator.clipboard.writeText(window.location.origin + `/book/${book._id}`);
                    toast.success('Đã sao chép link vào clipboard');
                }
                break;
            default:
                break;
        }
    }, [navigate]);

    const handleSearchChange = (value: string) => {
        setSearchInput(value);

        // Generate search suggestions based on current books
        if (value.length > 1 && books.length > 0) {
            const suggestions = new Set<string>();
            books.forEach(book => {
                // Add book titles
                if (book.title.toLowerCase().includes(value.toLowerCase())) {
                    suggestions.add(book.title);
                }
                // Add authors
                book.authors.forEach(author => {
                    if (author.toLowerCase().includes(value.toLowerCase())) {
                        suggestions.add(author);
                    }
                });
                // Add keywords
                book.keywords?.forEach(keyword => {
                    if (keyword.toLowerCase().includes(value.toLowerCase())) {
                        suggestions.add(keyword);
                    }
                });
            });
            setSearchSuggestions(Array.from(suggestions).slice(0, 5));
            setShowSearchSuggestions(true);
        } else {
            setShowSearchSuggestions(false);
        }
    };

    // Debounce search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleFilterChange('q', searchInput);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('q', searchInput);
        setShowSearchSuggestions(false);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchInput(suggestion);
        handleFilterChange('q', suggestion);
        setShowSearchSuggestions(false);
    };

    const handleAddToCart = (book: Book) => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để mượn sách');
            return;
        }

        if (book.quantityAvailable <= 0) {
            toast.error('Sách này đã hết hàng');
            return;
        }

        const existingCartItem = cartItems.find(item => item.bookId === book._id);
        if (existingCartItem && existingCartItem.qty >= book.quantityAvailable) {
            toast.error(`Bạn đã mượn tối đa ${book.quantityAvailable} cuốn sách này`);
            return;
        }

        addItem(book, 1);
    };

    const isBookInCart = (bookId: string) => {
        return cartItems.some(item => item.bookId === bookId);
    };

    const getBookCartQuantity = (bookId: string) => {
        const item = cartItems.find(item => item.bookId === bookId);
        return item ? item.qty : 0;
    };

    const clearFilters = useCallback(() => {
        setFilters({
            q: '',
            categoryId: '',
            categorySlug: '',
            categoryName: '',
            publisherId: '',
            facultyId: '',
            departmentId: '',
            year: undefined,
            page: 1,
            limit: 12,
        });
        setSearchInput('');
        setSortBy('newest');
        setStatusFilter('');
        setYearRange({ min: 0, max: 0 });
        setSelectedBooks(new Set());
        setShowBulkActions(false);
        // Scroll to top when clearing filters
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Update bulk actions visibility
    useEffect(() => {
        setShowBulkActions(selectedBooks.size > 0);
    }, [selectedBooks.size]);

    // Update categoryId when categorySlug changes from URL
    useEffect(() => {
        if (filters.categorySlug && categories && !filters.categoryId) {
            const category = categories.find(c => c.slug === filters.categorySlug);
            if (category) {
                console.log('Setting category from URL:', category.name, category._id);
                setFilters(prev => ({
                    ...prev,
                    categoryId: category._id,
                    categoryName: category.name
                }));
            }
        }
    }, [filters.categorySlug, categories, filters.categoryId]);

    const quickFilters = [
        { label: 'Mới về', value: 'newest', icon: Clock, color: 'text-blue-400' },
        { label: 'Hot', value: 'popular', icon: TrendingUp, color: 'text-red-400' },
        { label: 'Được mượn nhiều', value: 'most-borrowed', icon: Star, color: 'text-yellow-400' },
        { label: 'Còn sách', value: 'available', icon: BookOpen, color: 'text-green-400' },
    ];

    const sortOptions = [
        { label: 'Mới nhất', value: 'newest', icon: SortDesc, description: 'Sách mới nhất' },
        { label: 'Cũ nhất', value: 'oldest', icon: SortAsc, description: 'Sách cũ nhất' },
        { label: 'Tên A-Z', value: 'title-asc', icon: SortAsc, description: 'Sắp xếp theo tên' },
        { label: 'Tên Z-A', value: 'title-desc', icon: SortDesc, description: 'Sắp xếp ngược tên' },
        { label: 'Năm xuất bản', value: 'year', icon: SortDesc, description: 'Năm xuất bản mới' },
        { label: 'Số lượng', value: 'quantity', icon: SortDesc, description: 'Số lượng nhiều' },
        { label: 'Tác giả A-Z', value: 'author-asc', icon: SortAsc, description: 'Sắp xếp theo tác giả' },
        { label: 'Đánh giá cao', value: 'rating', icon: Star, description: 'Đánh giá cao nhất' },
    ];

    // Apply filtering and sorting to books
    const sortedBooks = useMemo(() => {
        if (!booksData?.books) return [];

        let books = [...booksData.books];

        // Apply status filter
        if (statusFilter) {
            books = books.filter(book => {
                switch (statusFilter) {
                    case 'available':
                        return book.quantityAvailable > 0;
                    case 'low-stock':
                        return book.quantityAvailable > 0 && book.quantityAvailable <= 2;
                    case 'out-of-stock':
                        return book.quantityAvailable === 0;
                    default:
                        return true;
                }
            });
        }

        // Apply year range filter
        if (yearRange.min > 0 || yearRange.max > 0) {
            books = books.filter(book => {
                const bookYear = book.year || 0;
                if (yearRange.min > 0 && yearRange.max > 0) {
                    return bookYear >= yearRange.min && bookYear <= yearRange.max;
                } else if (yearRange.min > 0) {
                    return bookYear >= yearRange.min;
                } else if (yearRange.max > 0) {
                    return bookYear <= yearRange.max;
                }
                return true;
            });
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                return books.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'oldest':
                return books.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case 'title-asc':
                return books.sort((a, b) => a.title.localeCompare(b.title));
            case 'title-desc':
                return books.sort((a, b) => b.title.localeCompare(a.title));
            case 'author-asc':
                return books.sort((a, b) => a.authors[0]?.localeCompare(b.authors[0] || '') || 0);
            case 'year':
                return books.sort((a, b) => (b.year || 0) - (a.year || 0));
            case 'quantity':
                return books.sort((a, b) => b.quantityAvailable - a.quantityAvailable);
            case 'rating':
                return books.sort((a, b) => ((b as any).rating || 0) - ((a as any).rating || 0));
            case 'popular':
                return books.sort((a, b) => ((b as any).borrowCount || 0) - ((a as any).borrowCount || 0));
            case 'most-borrowed':
                return books.sort((a, b) => ((b as any).borrowCount || 0) - ((a as any).borrowCount || 0));
            case 'available':
                return books.filter(book => book.quantityAvailable > 0);
            default:
                return books;
        }
    }, [booksData?.books, sortBy, statusFilter, yearRange]);

    const books = sortedBooks;
    const meta = booksData?.meta;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl/Cmd + K to focus search
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
                searchInput?.focus();
            }
            // Escape to close dropdowns
            if (event.key === 'Escape') {
                setIsSortOpen(false);
                setShowSearchSuggestions(false);
            }
            // G to toggle grid view
            if (event.key === 'g' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                setViewMode('grid');
            }
            // L to toggle list view
            if (event.key === 'l' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                setViewMode('list');
            }
            // Ctrl/Cmd + A to select all books
            if ((event.ctrlKey || event.metaKey) && event.key === 'a' && books.length > 0) {
                event.preventDefault();
                handleSelectAll(books);
            }
            // Escape to clear selection
            if (event.key === 'Escape' && selectedBooks.size > 0) {
                setSelectedBooks(new Set());
                setShowBulkActions(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [books, selectedBooks.size, handleSelectAll]);

    const statusFilters = useMemo(() => {
        if (!booksData?.books) return [];

        const allBooks = booksData.books;
        return [
            { label: 'Còn sách', value: 'available', count: allBooks.filter(b => b.quantityAvailable > 0).length },
            { label: 'Sắp hết', value: 'low-stock', count: allBooks.filter(b => b.quantityAvailable > 0 && b.quantityAvailable <= 2).length },
            { label: 'Hết sách', value: 'out-of-stock', count: allBooks.filter(b => b.quantityAvailable === 0).length },
        ];
    }, [booksData?.books]);

    // Get active filters count
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.q) count++;
        if (filters.categoryId) count++;
        if (filters.publisherId) count++;
        if (filters.facultyId) count++;
        if (filters.departmentId) count++;
        if (filters.year) count++;
        if (statusFilter) count++;
        return count;
    }, [filters, statusFilter]);

    // Get filter summary for display
    const filterSummary = useMemo(() => {
        const summary = [];
        if (filters.q) summary.push(`Tìm kiếm: "${filters.q}"`);
        if (filters.categoryName) {
            summary.push(`Thể loại: ${filters.categoryName}`);
        } else if (filters.categoryId && categories) {
            const category = categories.find(c => c._id === filters.categoryId);
            if (category) summary.push(`Thể loại: ${category.name}`);
        }
        if (filters.publisherId && publishers) {
            const publisher = publishers.find(p => p._id === filters.publisherId);
            if (publisher) summary.push(`NXB: ${publisher.name}`);
        }
        if (filters.facultyId && faculties) {
            const faculty = faculties.find(f => f._id === filters.facultyId);
            if (faculty) summary.push(`Khoa: ${faculty.name}`);
        }
        if (filters.departmentId && departments) {
            const department = departments.find(d => d._id === filters.departmentId);
            if (department) summary.push(`Ngành: ${department.name}`);
        }
        if (filters.year) summary.push(`Năm: ${filters.year}`);
        if (statusFilter) {
            const statusLabel = statusFilters.find(s => s.value === statusFilter)?.label;
            if (statusLabel) summary.push(`Trạng thái: ${statusLabel}`);
        }
        return summary;
    }, [filters, categories, publishers, faculties, departments, statusFilter, statusFilters]);

    return (
        <div className="min-h-screen bg-dark-900 pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-heading font-bold text-dark-50">
                            Danh mục sách
                        </h1>
                        {filters.categoryName && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-300 rounded-lg">
                                <BookOpen className="w-4 h-4" />
                                <span className="text-sm font-medium">Đang xem: {filters.categoryName}</span>
                                <button
                                    onClick={() => {
                                        setFilters(prev => ({
                                            ...prev,
                                            categoryId: '',
                                            categorySlug: '',
                                            categoryName: ''
                                        }));
                                    }}
                                    className="ml-2 text-primary-400 hover:text-primary-300 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative search-container">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tìm sách theo tên, tác giả, ISBN... (Ctrl+K)"
                                    value={searchInput}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    onFocus={() => {
                                        setIsSearchFocused(true);
                                        if (searchSuggestions.length > 0) {
                                            setShowSearchSuggestions(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        setIsSearchFocused(false);
                                        // Delay hiding suggestions to allow clicking
                                        setTimeout(() => setShowSearchSuggestions(false), 200);
                                    }}
                                    className={`w-full pl-10 pr-4 py-3 input-field transition-all duration-200 ${isSearchFocused ? 'ring-2 ring-primary-500/50' : ''
                                        }`}
                                    aria-label="Tìm kiếm sách"
                                    autoComplete="off"
                                />
                                {searchInput && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchInput('');
                                            handleFilterChange('q', '');
                                            setShowSearchSuggestions(false);
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-300 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </form>

                            {/* Search Suggestions */}
                            {showSearchSuggestions && searchSuggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 glass-card rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                                >
                                    <div className="p-2">
                                        <div className="text-xs text-dark-400 mb-2 px-2">Gợi ý tìm kiếm:</div>
                                        {searchSuggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="w-full text-left px-3 py-2 text-sm text-dark-300 hover:bg-dark-700/50 rounded-lg transition-colors"
                                            >
                                                <Search className="w-3 h-3 inline mr-2" />
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Filter Toggle */}
                        <Button
                            variant="secondary"
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="lg:hidden relative"
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Bộ lọc
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>

                        {/* Sort Dropdown */}
                        <div className="relative sort-dropdown">
                            <Button
                                variant="secondary"
                                onClick={() => setIsSortOpen(!isSortOpen)}
                                className="flex items-center gap-2"
                            >
                                {sortOptions.find(opt => opt.value === sortBy)?.icon &&
                                    React.createElement(sortOptions.find(opt => opt.value === sortBy)!.icon, { className: "w-4 h-4" })
                                }
                                {sortOptions.find(opt => opt.value === sortBy)?.label || 'Sắp xếp'}
                                <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                            </Button>

                            <AnimatePresence>
                                {isSortOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 top-full mt-2 w-48 glass-card rounded-lg shadow-lg z-50"
                                    >
                                        <div className="p-2">
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortBy(option.value);
                                                        setIsSortOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-3 text-sm rounded-lg transition-colors ${sortBy === option.value
                                                        ? 'bg-primary-500 text-white'
                                                        : 'text-dark-300 hover:bg-dark-700'
                                                        }`}
                                                >
                                                    <option.icon className="w-4 h-4 flex-shrink-0" />
                                                    <div className="flex-1 text-left">
                                                        <div className="font-medium">{option.label}</div>
                                                        <div className="text-xs opacity-75">{option.description}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-dark-300'
                                    }`}
                                title="Chế độ lưới (G)"
                                aria-label="Chuyển sang chế độ lưới"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-dark-300'
                                    }`}
                                title="Chế độ danh sách (L)"
                                aria-label="Chuyển sang chế độ danh sách"
                            >
                                <List className="w-4 h-4" />
                            </button>

                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-2 rounded-lg transition-colors text-dark-400 hover:text-dark-300 hover:bg-white/10 disabled:opacity-50"
                                title="Làm mới dữ liệu"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="space-y-4 mt-4">
                        {/* Sort Filters */}
                        <div>
                            <h4 className="text-sm font-medium text-dark-200 mb-2">Sắp xếp nhanh:</h4>
                            <div className="flex flex-wrap gap-2">
                                {quickFilters.map((filter) => (
                                    <button
                                        key={filter.value}
                                        className={`px-4 py-2 text-sm glass rounded-full transition-colors duration-200 flex items-center gap-2 ${sortBy === filter.value
                                            ? 'bg-primary-500 text-white'
                                            : 'hover:bg-primary-500/20'
                                            }`}
                                        onClick={() => setSortBy(filter.value)}
                                    >
                                        <filter.icon className={`w-4 h-4 ${filter.color}`} />
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Filters */}
                        <div>
                            <h4 className="text-sm font-medium text-dark-200 mb-2">Trạng thái sách:</h4>
                            <div className="flex flex-wrap gap-2">
                                {statusFilters.map((filter) => (
                                    <button
                                        key={filter.value}
                                        className={`px-4 py-2 text-sm glass rounded-full transition-colors duration-200 flex items-center gap-2 ${statusFilter === filter.value
                                            ? 'bg-primary-500 text-white'
                                            : 'hover:bg-primary-500/20'
                                            }`}
                                        onClick={() => {
                                            if (statusFilter === filter.value) {
                                                setStatusFilter('');
                                            } else {
                                                setStatusFilter(filter.value);
                                            }
                                        }}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${filter.value === 'available' ? 'bg-green-400' :
                                            filter.value === 'low-stock' ? 'bg-yellow-400' :
                                                'bg-red-400'
                                            }`}></span>
                                        {filter.label}
                                        <span className="text-xs bg-dark-600 px-2 py-0.5 rounded-full">
                                            {filter.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Filters */}
                    <div className={`lg:w-64 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
                        <div className="glass-card p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-heading font-semibold text-dark-50">Bộ lọc</h3>
                                    {activeFiltersCount > 0 && (
                                        <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="lg:hidden p-1 rounded-full hover:bg-white/10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-dark-200 mb-2">
                                    Thể loại
                                </label>
                                <select
                                    value={categoryId || ''}
                                    onChange={(e) => {
                                        const selectedCategory = categories?.find(c => c._id === e.target.value);
                                        if (selectedCategory) {
                                            handleFilterChange('categoryId', e.target.value);
                                            handleFilterChange('categorySlug', selectedCategory.slug);
                                            handleFilterChange('categoryName', selectedCategory.name);
                                        } else {
                                            handleFilterChange('categoryId', '');
                                            handleFilterChange('categorySlug', '');
                                            handleFilterChange('categoryName', '');
                                        }
                                    }}
                                    className="w-full input-field"
                                >
                                    <option value="">Tất cả thể loại</option>
                                    {categories?.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {filters.categoryName && (
                                    <div className="mt-2 px-3 py-2 bg-primary-500/20 text-primary-300 text-sm rounded-lg">
                                        Đang lọc: {filters.categoryName}
                                    </div>
                                )}
                            </div>

                            {/* Publisher Filter */}
                            <div>
                                <label className="block text-sm font-medium text-dark-200 mb-2">
                                    Nhà xuất bản
                                </label>
                                <select
                                    value={filters.publisherId || ''}
                                    onChange={(e) => handleFilterChange('publisherId', e.target.value)}
                                    className="w-full input-field"
                                >
                                    <option value="">Tất cả nhà xuất bản</option>
                                    {publishers?.map((publisher) => (
                                        <option key={publisher._id} value={publisher._id}>
                                            {publisher.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Faculty Filter */}
                            <div>
                                <label className="block text-sm font-medium text-dark-200 mb-2">
                                    Khoa
                                </label>
                                <select
                                    value={filters.facultyId || ''}
                                    onChange={(e) => {
                                        handleFilterChange('facultyId', e.target.value);
                                        handleFilterChange('departmentId', ''); // Reset department when faculty changes
                                    }}
                                    className="w-full input-field"
                                >
                                    <option value="">Tất cả khoa</option>
                                    {faculties?.map((faculty) => (
                                        <option key={faculty._id} value={faculty._id}>
                                            {faculty.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Department Filter */}
                            {filters.facultyId && (
                                <div>
                                    <label className="block text-sm font-medium text-dark-200 mb-2">
                                        Ngành
                                    </label>
                                    <select
                                        value={filters.departmentId || ''}
                                        onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                                        className="w-full input-field"
                                    >
                                        <option value="">Tất cả ngành</option>
                                        {departments?.map((department) => (
                                            <option key={department._id} value={department._id}>
                                                {department.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Year Filter */}
                            <div>
                                <label className="block text-sm font-medium text-dark-200 mb-2">
                                    Năm xuất bản
                                </label>
                                <input
                                    type="number"
                                    placeholder="Nhập năm"
                                    value={filters.year || ''}
                                    onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full input-field"
                                    min="1900"
                                    max={new Date().getFullYear()}
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-dark-200 mb-2">
                                    Trạng thái sách
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full input-field"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    {statusFilters.map((filter) => (
                                        <option key={filter.value} value={filter.value}>
                                            {filter.label} ({filter.count})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Advanced Filters Toggle */}
                            <div>
                                <button
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className="w-full flex items-center justify-between p-3 text-sm text-dark-300 hover:bg-dark-700/50 rounded-lg transition-colors"
                                >
                                    <span>Bộ lọc nâng cao</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                                </button>

                                {showAdvancedFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 space-y-4"
                                    >
                                        {/* Year Range Filter */}
                                        <div>
                                            <label className="block text-sm font-medium text-dark-200 mb-2">
                                                Khoảng năm xuất bản
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Từ năm"
                                                    value={yearRange.min || ''}
                                                    onChange={(e) => setYearRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
                                                    className="flex-1 input-field"
                                                    min="1900"
                                                    max={new Date().getFullYear()}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Đến năm"
                                                    value={yearRange.max || ''}
                                                    onChange={(e) => setYearRange(prev => ({ ...prev, max: parseInt(e.target.value) || 0 }))}
                                                    className="flex-1 input-field"
                                                    min="1900"
                                                    max={new Date().getFullYear()}
                                                />
                                            </div>
                                        </div>

                                        {/* Quick Filter Buttons */}
                                        <div>
                                            <label className="block text-sm font-medium text-dark-200 mb-2">
                                                Lọc nhanh
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    onClick={() => setStatusFilter('available')}
                                                    className="px-3 py-2 text-xs bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                                >
                                                    Chỉ sách có sẵn
                                                </button>
                                                <button
                                                    onClick={() => setStatusFilter('low-stock')}
                                                    className="px-3 py-2 text-xs bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                                                >
                                                    Sắp hết sách
                                                </button>
                                                <button
                                                    onClick={() => setSortBy('newest')}
                                                    className="px-3 py-2 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                                >
                                                    Sách mới nhất
                                                </button>
                                                <button
                                                    onClick={() => setSortBy('rating')}
                                                    className="px-3 py-2 text-xs bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                                                >
                                                    Đánh giá cao
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Clear Filters */}
                            <Button
                                variant="ghost"
                                onClick={clearFilters}
                                className="w-full"
                                disabled={activeFiltersCount === 0}
                            >
                                Xóa bộ lọc ({activeFiltersCount})
                            </Button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Bulk Actions Bar */}
                        <AnimatePresence>
                            {showBulkActions && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="glass-card p-4 mb-6 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-dark-300">
                                            Đã chọn {selectedBooks.size} cuốn sách
                                        </span>
                                        <button
                                            onClick={() => handleSelectAll(books)}
                                            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                                        >
                                            {selectedBooks.size === books.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleBulkAddToCart(books)}
                                            disabled={!isAuthenticated}
                                        >
                                            Thêm vào giỏ mượn
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedBooks(new Set());
                                                setShowBulkActions(false);
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                    <p className="text-dark-300">
                                        {isLoading ? 'Đang tải...' : `Tìm thấy ${meta?.total || 0} kết quả`}
                                    </p>
                                    {books.length > 0 && (
                                        <div className="flex items-center gap-4 text-sm text-dark-400">
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                {books.filter(b => b.quantityAvailable > 0).length} còn sách
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Star className="w-4 h-4" />
                                                {books.filter(b => (b as any).rating && (b as any).rating > 4).length} đánh giá cao
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {filters.q && (
                                    <p className="text-sm text-dark-400 mb-2">
                                        Kết quả cho: <span className="text-primary-400 font-medium">"{filters.q}"</span>
                                    </p>
                                )}

                                {filterSummary.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {filterSummary.map((filter, index) => (
                                            <motion.span
                                                key={index}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="px-3 py-1 text-xs bg-primary-500/20 text-primary-300 rounded-full border border-primary-500/30"
                                            >
                                                {filter}
                                            </motion.span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Results per page */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-dark-400">Hiển thị:</span>
                                <select
                                    value={filters.limit || 12}
                                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                                    className="px-3 py-1 text-sm bg-dark-800 border border-dark-600 rounded-lg text-dark-300"
                                >
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                    <option value={48}>48</option>
                                    <option value={96}>96</option>
                                </select>
                            </div>
                        </div>

                        {/* Books Grid/List */}
                        {isLoading ? (
                            <div className="space-y-4">
                                <div className="text-center py-4">
                                    <div className="inline-flex items-center gap-2 text-dark-400">
                                        <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                        Đang tải sách...
                                    </div>
                                </div>
                                <BookListSkeleton />
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">⚠️</div>
                                <div className="text-red-400 mb-4">
                                    Có lỗi xảy ra khi tải dữ liệu
                                </div>
                                <p className="text-dark-400 mb-6">
                                    Vui lòng thử lại sau hoặc kiểm tra kết nối mạng
                                </p>
                                <Button onClick={() => window.location.reload()}>
                                    Thử lại
                                </Button>
                            </div>
                        ) : books.length === 0 ? (
                            <div className="text-center py-12">
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-6xl mb-4"
                                >
                                    📚
                                </motion.div>
                                <h3 className="text-xl font-heading font-semibold text-dark-300 mb-2">
                                    Không tìm thấy kết quả nào
                                </h3>
                                <p className="text-dark-400 mb-6 max-w-md mx-auto">
                                    {activeFiltersCount > 0
                                        ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm thấy sách phù hợp'
                                        : 'Chưa có sách nào trong thư viện. Hãy quay lại sau!'
                                    }
                                </p>

                                {activeFiltersCount > 0 && (
                                    <div className="space-y-4">
                                        <Button onClick={clearFilters} variant="primary">
                                            Xóa bộ lọc
                                        </Button>
                                        <div className="text-sm text-dark-400">
                                            Hoặc thử các từ khóa khác như: "lập trình", "khoa học", "văn học"
                                        </div>
                                    </div>
                                )}

                                {!isAuthenticated && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="mt-6 p-4 bg-primary-500/10 rounded-lg max-w-sm mx-auto"
                                    >
                                        <p className="text-sm text-primary-300 mb-3">
                                            Đăng nhập để mượn sách và truy cập đầy đủ tính năng
                                        </p>
                                        <Button
                                            variant="primary"
                                            onClick={() => navigate('/login')}
                                            className="w-full"
                                        >
                                            Đăng nhập ngay
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        ) : (
                            <div className={`${viewMode === 'grid'
                                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                                : 'space-y-4'
                                }`}>
                                {books.map((book: Book, index: number) => (
                                    <motion.div
                                        key={book._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative group"
                                    >
                                        {/* Selection Checkbox */}
                                        <div className="absolute top-2 left-2 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedBooks.has(book._id)}
                                                onChange={() => handleSelectBook(book._id)}
                                                className="w-4 h-4 text-primary-500 bg-dark-800 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleBookAction('view', book)}
                                                    className="p-2 bg-dark-800/80 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4 text-dark-300" />
                                                </button>
                                                <button
                                                    onClick={() => handleBookAction('favorite', book)}
                                                    className="p-2 bg-dark-800/80 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Thêm vào yêu thích"
                                                >
                                                    <Heart className="w-4 h-4 text-dark-300" />
                                                </button>
                                                <button
                                                    onClick={() => handleBookAction('share', book)}
                                                    className="p-2 bg-dark-800/80 hover:bg-dark-700 rounded-lg transition-colors"
                                                    title="Chia sẻ"
                                                >
                                                    <Share2 className="w-4 h-4 text-dark-300" />
                                                </button>
                                            </div>
                                        </div>

                                        {viewMode === 'list' ? (
                                            <div className="glass-card p-4 hover:bg-dark-700/50 transition-colors">
                                                <div className="flex gap-4">
                                                    {/* Book Cover */}
                                                    <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                                                        {book.coverImageUrl ? (
                                                            <img
                                                                src={getCoverImageUrl(book.coverImageUrl)}
                                                                alt={book.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className={`w-full h-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center ${book.coverImageUrl ? 'hidden' : ''}`}>
                                                            <BookOpen className="w-8 h-8 text-primary-400" />
                                                        </div>
                                                    </div>

                                                    {/* Book Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-heading font-semibold text-dark-50 text-lg mb-2 line-clamp-2">
                                                            {book.title}
                                                        </h3>
                                                        <p className="text-dark-300 mb-2 line-clamp-1">
                                                            {book.authors.join(', ')}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-sm text-dark-400 mb-2">
                                                            {book.year && <span>Năm: {book.year}</span>}
                                                            {book.categoryId && <span>Thể loại: {book.categoryId.name}</span>}
                                                            {book.publisherId && <span>NXB: {book.publisherId.name}</span>}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-dark-400">Còn lại:</span>
                                                                <span className={`text-sm font-medium ${book.quantityAvailable > 5 ? 'text-green-400' :
                                                                    book.quantityAvailable > 0 ? 'text-yellow-400' : 'text-red-400'
                                                                    }`}>
                                                                    {book.quantityAvailable}/{book.quantityTotal}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {book.quantityAvailable > 0 && (
                                                                    <div className="flex items-center gap-2">
                                                                        {isAuthenticated ? (
                                                                            <>
                                                                                {isBookInCart(book._id) ? (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-sm text-primary-400">
                                                                                            Đã thêm ({getBookCartQuantity(book._id)})
                                                                                        </span>
                                                                                        <Button
                                                                                            variant="primary"
                                                                                            size="sm"
                                                                                            onClick={() => handleAddToCart(book)}
                                                                                            disabled={getBookCartQuantity(book._id) >= book.quantityAvailable}
                                                                                        >
                                                                                            + Thêm
                                                                                        </Button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <Button
                                                                                        variant="primary"
                                                                                        size="sm"
                                                                                        onClick={() => handleAddToCart(book)}
                                                                                    >
                                                                                        Mượn sách
                                                                                    </Button>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <Button
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                onClick={() => window.location.href = '/login'}
                                                                            >
                                                                                Đăng nhập để mượn
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => window.location.href = `/book/${book._id}`}
                                                                >
                                                                    Chi tiết
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <BookCard book={book} />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {meta && meta.pages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between mt-12 gap-4">
                                <div className="text-sm text-dark-400">
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                            Đang tải...
                                        </div>
                                    ) : (
                                        `Hiển thị ${((filters.page || 1) - 1) * (filters.limit || 12) + 1} - ${Math.min((filters.page || 1) * (filters.limit || 12), meta.total)} trong ${meta.total} kết quả`
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => handlePageChange(1)}
                                        disabled={isLoading || !filters.page || filters.page <= 1}
                                        className="px-3 py-2"
                                    >
                                        Đầu
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                                        disabled={isLoading || !filters.page || filters.page <= 1}
                                        className="px-3 py-2"
                                    >
                                        Trước
                                    </Button>

                                    {/* Page numbers */}
                                    <div className="flex items-center gap-1">
                                        {(() => {
                                            const currentPage = filters.page || 1;
                                            const totalPages = meta.pages;
                                            const pages = [];

                                            // Show first page
                                            if (currentPage > 3) {
                                                pages.push(
                                                    <Button
                                                        key={1}
                                                        variant="ghost"
                                                        onClick={() => handlePageChange(1)}
                                                        disabled={isLoading}
                                                        className="w-10 h-10 p-0"
                                                    >
                                                        1
                                                    </Button>
                                                );
                                                if (currentPage > 4) {
                                                    pages.push(
                                                        <span key="ellipsis1" className="px-2 text-dark-400">...</span>
                                                    );
                                                }
                                            }

                                            // Show pages around current page
                                            for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                                                pages.push(
                                                    <Button
                                                        key={i}
                                                        variant={currentPage === i ? 'primary' : 'ghost'}
                                                        onClick={() => handlePageChange(i)}
                                                        disabled={isLoading}
                                                        className="w-10 h-10 p-0"
                                                    >
                                                        {i}
                                                    </Button>
                                                );
                                            }

                                            // Show last page
                                            if (currentPage < totalPages - 2) {
                                                if (currentPage < totalPages - 3) {
                                                    pages.push(
                                                        <span key="ellipsis2" className="px-2 text-dark-400">...</span>
                                                    );
                                                }
                                                pages.push(
                                                    <Button
                                                        key={totalPages}
                                                        variant="ghost"
                                                        onClick={() => handlePageChange(totalPages)}
                                                        disabled={isLoading}
                                                        className="w-10 h-10 p-0"
                                                    >
                                                        {totalPages}
                                                    </Button>
                                                );
                                            }

                                            return pages;
                                        })()}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        onClick={() => handlePageChange(Math.min(meta.pages, (filters.page || 1) + 1))}
                                        disabled={isLoading || !filters.page || filters.page >= meta.pages}
                                        className="px-3 py-2"
                                    >
                                        Sau
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        onClick={() => handlePageChange(meta.pages)}
                                        disabled={isLoading || !filters.page || filters.page >= meta.pages}
                                        className="px-3 py-2"
                                    >
                                        Cuối
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Catalog;
