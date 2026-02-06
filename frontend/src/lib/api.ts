import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, AuthResponse, Book, BookFilters, Category, Publisher, Faculty, Department, Loan, LoanFilters, User } from '../types';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'http://localhost:2409/api',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('accessToken');
                console.log('API Request - URL:', config.url);
                console.log('API Request - Token present:', !!token);
                console.log('API Request - Token value:', token ? token.substring(0, 20) + '...' : 'No token');

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor to handle token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                console.log('API Response Error - Status:', error.response?.status);
                console.log('API Response Error - Data:', error.response?.data);
                console.log('API Response Error - URL:', error.config?.url);

                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshToken = localStorage.getItem('refreshToken');
                        if (refreshToken) {
                            const response = await axios.post(`${this.client.defaults.baseURL}/auth/refresh`, {
                                refreshToken,
                            });

                            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                            localStorage.setItem('accessToken', accessToken);
                            localStorage.setItem('refreshToken', newRefreshToken);

                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        window.location.href = '/login';
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    // Auth endpoints
    async login(email: string, password: string): Promise<AuthResponse> {
        const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.client.post('/auth/login', {
            email,
            password,
        });
        return response.data.data;
    }

    async register(fullName: string, email: string, password: string): Promise<AuthResponse> {
        const response: AxiosResponse<ApiResponse<AuthResponse>> = await this.client.post('/auth/register', {
            fullName,
            email,
            password,
        });
        return response.data.data;
    }

    async getMe(): Promise<User> {
        const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.client.get('/auth/me');
        return response.data.data.user;
    }

    // Books endpoints
    async getBooks(filters: BookFilters = {}): Promise<{ books: Book[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<Book[]>> = await this.client.get('/books', {
            params: filters,
        });
        return {
            books: response.data.data,
            meta: response.data.meta,
        };
    }

    async getBook(id: string): Promise<Book> {
        const response: AxiosResponse<ApiResponse<Book>> = await this.client.get(`/books/${id}`);
        return response.data.data;
    }

    async getBookStats(bookId: string): Promise<{ views: number; likes: number; borrows: number }> {
        const response: AxiosResponse<ApiResponse<{ views: number; likes: number; borrows: number }>> = await this.client.get(`/books/${bookId}/stats`);
        return response.data.data;
    }

    async trackBookView(bookId: string): Promise<void> {
        await this.client.post(`/books/${bookId}/view`);
    }

    // Loan Management endpoints
    async getPendingLoans(page = 1, limit = 10, status = 'PENDING'): Promise<{ data: any[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<any[]>> = await this.client.get('/loans/admin/pending', {
            params: { page, limit, status }
        });
        return {
            data: response.data.data,
            meta: response.data.meta
        };
    }

    async approveLoan(loanId: string, notes?: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/loans/${loanId}/approve`, { notes });
        return response.data.data;
    }

    async rejectLoan(loanId: string, reason?: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/loans/${loanId}/reject`, { reason });
        return response.data.data;
    }

    async markAsBorrowed(loanId: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/loans/${loanId}/borrow`);
        return response.data.data;
    }

    async returnBooks(loanId: string, returnedItems: any[], condition = 'GOOD'): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/loans/${loanId}/return`, {
            returnedItems,
            condition
        });
        return response.data.data;
    }

    async requestExtension(loanId: string, extensionDays: number, reason?: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.post(`/loans/${loanId}/extend`, {
            extensionDays,
            reason
        });
        return response.data.data;
    }

    async getExtensions(page = 1, limit = 10, status = 'PENDING'): Promise<{ data: any[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<any[]>> = await this.client.get('/loans/extensions', {
            params: { page, limit, status }
        });
        return {
            data: response.data.data,
            meta: response.data.meta
        };
    }

    async approveExtension(extensionId: string, reviewNotes?: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/loans/extensions/${extensionId}/approve`, {
            reviewNotes
        });
        return response.data.data;
    }

    async rejectExtension(extensionId: string, reviewNotes?: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/loans/extensions/${extensionId}/reject`, {
            reviewNotes
        });
        return response.data.data;
    }

    async getFines(page = 1, limit = 10, status = 'PENDING'): Promise<{ data: any[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<any[]>> = await this.client.get('/loans/fines', {
            params: { page, limit, status }
        });
        return {
            data: response.data.data,
            meta: response.data.meta
        };
    }

    async payFine(fineId: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/loans/fines/${fineId}/pay`);
        return response.data.data;
    }

    async waiveFine(fineId: string, reason?: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/loans/fines/${fineId}/waive`, {
            reason
        });
        return response.data.data;
    }

    async getFinePolicy(): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/fine-policy');
        return response.data.data;
    }

    // Return loan
    async returnLoan(loanId: string, returnedItems: any[], notes?: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/loans/${loanId}/return`, {
            returnedItems,
            notes
        });
        return response.data.data;
    }

    // Categories endpoints
    async getCategories(): Promise<Category[]> {
        // Fetch all categories by getting multiple pages
        let allCategories: Category[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response: AxiosResponse<ApiResponse<Category[]>> = await this.client.get(`/categories?page=${page}&limit=10`);
            console.log(`Categories API response page ${page}:`, response.data);

            if (response.data.success && response.data.data) {
                allCategories = [...allCategories, ...response.data.data];

                // Check if there are more pages
                const totalPages = response.data.meta?.pages || 1;
                hasMore = page < totalPages;
                page++;
            } else {
                hasMore = false;
            }
        }

        console.log('All categories fetched:', allCategories.length);
        return allCategories;
    }

    // Publishers endpoints
    async getPublishers(): Promise<Publisher[]> {
        const response: AxiosResponse<ApiResponse<Publisher[]>> = await this.client.get('/publishers');
        return response.data.data;
    }

    async createPublisher(publisherData: any): Promise<Publisher> {
        const response: AxiosResponse<ApiResponse<Publisher>> = await this.client.post('/publishers', publisherData);
        return response.data.data;
    }

    // Faculties endpoints
    async getFaculties(): Promise<Faculty[]> {
        const response: AxiosResponse<ApiResponse<Faculty[]>> = await this.client.get('/faculties');
        return response.data.data;
    }

    // Departments endpoints
    async getDepartments(facultyId?: string): Promise<Department[]> {
        const response: AxiosResponse<ApiResponse<Department[]>> = await this.client.get('/departments', {
            params: facultyId ? { facultyId } : {},
        });
        return response.data.data;
    }

    // Loans endpoints
    async createLoan(dueDate: string, items: Array<{ bookId: string; qty: number }>): Promise<Loan> {
        const response: AxiosResponse<ApiResponse<Loan>> = await this.client.post('/loans/self', {
            dueDate,
            items,
        });
        return response.data.data;
    }

    async getUserLoans(filters: LoanFilters = {}): Promise<{ loans: Loan[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<Loan[]>> = await this.client.get('/users/me/loans', {
            params: filters,
        });
        return {
            loans: response.data.data,
            meta: response.data.meta,
        };
    }

    async getUserExtensions(page = 1, limit = 10, status?: string): Promise<{ data: any[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<any[]>> = await this.client.get('/users/me/extensions', {
            params: { page, limit, status }
        });
        return {
            data: response.data.data,
            meta: response.data.meta
        };
    }

    // Stats endpoints
    async getStats(): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/users/admin-stats');
        return response.data.data;
    }

    async getSummaryStats(): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/stats/summary');
        return response.data.data;
    }

    async getBooksByCategory(): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/stats/books-by-category');
        return response.data.data;
    }

    async getMonthlyBorrows(year?: number): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/stats/borrows-monthly', {
            params: year ? { year } : {}
        });
        return response.data.data;
    }


    async getRecentActivity(limit = 10): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/loans/recent', {
            params: { limit }
        });
        return response.data.data;
    }

    async getSystemHealth(): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/system/health');
        return response.data.data;
    }

    async getPreviousMonthStats(): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/stats/previous-month');
        return response.data.data;
    }

    async getRecentActivities(limit = 10): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/activities/recent', {
            params: { limit }
        });
        return response.data.data;
    }

    async getSystemLogs(limit = 10): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/system/logs', {
            params: { limit }
        });
        return response.data.data;
    }

    async updateProfile(profileData: { fullName?: string; email?: string }): Promise<{ user: User }> {
        const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.client.patch('/users/profile', profileData);
        return response.data.data;
    }

    async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
        await this.client.put('/users/me/password', {
            currentPassword,
            newPassword,
            confirmPassword
        });
    }

    async uploadAvatar(formData: FormData): Promise<{ user: User }> {
        const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.client.post('/users/me/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    }

    async uploadBookCover(formData: FormData): Promise<{ coverImageUrl: string; filename: string; originalName: string; size: number }> {
        const response: AxiosResponse<ApiResponse<{ coverImageUrl: string; filename: string; originalName: string; size: number }>> = await this.client.post('/books/upload-cover', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    }

    async getMyStats(): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/users/my-stats');
        return response.data.data;
    }

    async updateNotificationSettings(settings: any): Promise<{ user: User }> {
        const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.client.patch('/users/notifications', settings);
        return response.data.data;
    }

    // Favorites endpoints
    async getFavorites(page = 1, limit = 10): Promise<{ favorites: any[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<any[]>> = await this.client.get('/favorites', {
            params: { page, limit },
        });
        return {
            favorites: response.data.data,
            meta: response.data.meta,
        };
    }

    async addFavorite(bookId: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.post('/favorites', { bookId });
        return response.data.data;
    }

    async removeFavorite(bookId: string): Promise<void> {
        await this.client.delete(`/favorites/${bookId}`);
    }

    async checkFavorite(bookId: string): Promise<{ isFavorited: boolean }> {
        const response: AxiosResponse<ApiResponse<{ isFavorited: boolean }>> = await this.client.get(`/favorites/check/${bookId}`);
        return response.data.data;
    }

    // Reviews endpoints
    async getBookReviews(bookId: string, page = 1, limit = 10): Promise<{ reviews: any[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get(`/reviews/book/${bookId}`, {
            params: { page, limit },
        });
        return {
            reviews: response.data.data.reviews,
            meta: {
                page: response.data.data.page,
                limit: response.data.data.limit,
                total: response.data.data.total,
                pages: response.data.data.pages,
            },
        };
    }

    async createReview(bookId: string, rating: number, comment: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.post('/reviews', {
            bookId,
            rating,
            comment,
        });
        return response.data.data;
    }

    async updateReview(reviewId: string, rating?: number, comment?: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/reviews/${reviewId}`, {
            rating,
            comment,
        });
        return response.data.data;
    }


    async getUserReviews(page = 1, limit = 10): Promise<{ reviews: any[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<any[]>> = await this.client.get('/reviews/user/me', {
            params: { page, limit },
        });
        return {
            reviews: response.data.data,
            meta: response.data.meta,
        };
    }

    // Book management methods
    async createBook(bookData: any): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.post('/books', bookData);
        return response.data.data;
    }

    async updateBook(id: string, bookData: any): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/books/${id}`, bookData);
        return response.data.data;
    }

    async deleteBook(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.delete(`/books/${id}`);
        return response.data.data;
    }

    // Category management methods
    async createCategory(categoryData: any): Promise<any> {
        console.log('API Client - Creating category with data:', categoryData);
        const response: AxiosResponse<ApiResponse<any>> = await this.client.post('/categories', categoryData);
        console.log('API Client - Create category response:', response.data);
        return response.data.data;
    }

    async updateCategory(id: string, categoryData: any): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/categories/${id}`, categoryData);
        return response.data.data;
    }

    async deleteCategory(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.delete(`/categories/${id}`);
        return response.data.data;
    }

    // User management methods
    async getUsers(filters: any = {}): Promise<{ users: any[]; meta: any }> {
        const response: AxiosResponse<ApiResponse<any[]>> = await this.client.get('/users', {
            params: filters
        });
        return {
            users: response.data.data,
            meta: response.data.meta
        };
    }

    async createUser(userData: any): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.post('/users', userData);
        return response.data.data;
    }

    async updateUser(id: string, userData: any): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/users/${id}`, userData);
        return response.data.data;
    }

    async deleteUser(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.delete(`/users/${id}`);
        return response.data.data;
    }

    async updateUserStatus(id: string, status: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/users/${id}`, { status });
        return response.data.data;
    }

    async getUserDetails(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get(`/users/${id}`);
        return response.data.data;
    }

    async getUserDetailedStats(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get(`/users/${id}/stats`);
        return response.data.data;
    }

    async getUserStats(): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/stats/summary');
        return response.data.data;
    }

    async getTopBooks(limit: number = 10): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get(`/stats/top-books?limit=${limit}`);
        return response.data.data;
    }

    async getUserRegistrations(year?: number): Promise<any> {
        const yearParam = year ? `?year=${year}` : '';
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get(`/stats/user-registrations${yearParam}`);
        return response.data.data;
    }

    // Reviews API
    async getReviews(params?: {
        page?: number;
        limit?: number;
        search?: string;
        rating?: number;
        status?: string;
    }): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/reviews', { params });
        return response.data.data;
    }

    async getReviewById(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get(`/reviews/${id}`);
        return response.data.data;
    }

    async approveReview(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/reviews/${id}/approve`);
        return response.data.data;
    }

    async hideReview(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/reviews/${id}/hide`);
        return response.data.data;
    }

    async showReview(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/reviews/${id}/show`);
        return response.data.data;
    }

    async deleteReview(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.delete(`/reviews/${id}`);
        return response.data.data;
    }

    // Notification methods
    async getNotifications(params?: { page?: number; limit?: number; type?: string; isRead?: boolean; }): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.get('/notifications', {
            params
        });
        return response.data.data;
    }

    async getUnreadNotificationCount(): Promise<{ count: number }> {
        const response: AxiosResponse<ApiResponse<{ count: number }>> = await this.client.get('/notifications/unread-count');
        return response.data.data;
    }

    async markNotificationAsRead(id: string): Promise<any> {
        const response: AxiosResponse<ApiResponse<any>> = await this.client.put(`/notifications/${id}/read`);
        return response.data.data;
    }

    async markAllNotificationsAsRead(): Promise<void> {
        await this.client.put('/notifications/mark-all-read');
    }

    async deleteNotification(id: string): Promise<void> {
        await this.client.delete(`/notifications/${id}`);
    }
}

export const apiClient = new ApiClient();
export default apiClient;
