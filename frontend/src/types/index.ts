export interface User {
    _id: string;
    email: string;
    fullName: string;
    role: 'USER' | 'LIBRARIAN' | 'ADMIN';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    avatarUrl?: string;
    facultyId?: string;
    departmentId?: string;
    notificationSettings?: {
        email: boolean;
        push: boolean;
        sms: boolean;
        loanReminders: boolean;
        fineAlerts: boolean;
        newBooks: boolean;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Book {
    _id: string;
    title: string;
    authors: string[];
    isbn: string;
    year: number;
    description?: string;
    keywords?: string[];
    coverImageUrl?: string;
    quantityTotal: number;
    quantityAvailable: number;
    location?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'LOST' | 'DAMAGED';
    categoryId: {
        _id: string;
        name: string;
        slug: string;
    };
    publisherId: {
        _id: string;
        name: string;
        slug: string;
    };
    facultyId?: {
        _id: string;
        name: string;
        code: string;
    };
    departmentId?: {
        _id: string;
        name: string;
        code: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Publisher {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Faculty {
    _id: string;
    name: string;
    code: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Department {
    _id: string;
    name: string;
    code: string;
    facultyId: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Loan {
    _id: string;
    code: string;
    readerUserId: {
        _id: string;
        fullName: string;
        email: string;
    };
    librarianId?: {
        _id: string;
        fullName: string;
        email: string;
    };
    createdByRole: 'USER' | 'LIBRARIAN';
    loanDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'OPEN' | 'RETURNED' | 'OVERDUE';
    items: Array<{
        bookId: {
            _id: string;
            title: string;
            isbn: string;
            authors: string[];
            coverImageUrl?: string;
        };
        qty: number;
    }>;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    error?: {
        code: string;
        message: string;
        details?: string[];
    };
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

export interface BookFilters {
    q?: string;
    categoryId?: string;
    categorySlug?: string;
    categoryName?: string;
    publisherId?: string;
    publisherName?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    facultyId?: string;
    departmentId?: string;
    year?: number;
    page?: number;
    limit?: number;
    sort?: string;
}

export interface LoanFilters {
    status?: string;
    readerUserId?: string;
    overdueOnly?: boolean;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    q?: string;
}

export interface CartItem {
    bookId: string;
    book: Book;
    qty: number;
}

export interface ThemeContextType {
    theme: 'light' | 'dark';
    isDark: boolean;
    toggleTheme: () => void;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (fullName: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateProfile: (profileData: { fullName?: string; email?: string }) => Promise<void>;
    updateUser: (userData: User) => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export interface CartContextType {
    items: CartItem[];
    addItem: (book: Book, qty?: number) => void;
    removeItem: (bookId: string) => void;
    updateQuantity: (bookId: string, qty: number) => void;
    clearCart: () => void;
    totalItems: number;
}
