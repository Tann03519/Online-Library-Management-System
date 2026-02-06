import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { User, AuthContextType } from '../types';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const userData = await apiClient.getMe();
                    setUser(userData);
                } catch (error) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await apiClient.login(email, password);
            const { user: userData, accessToken, refreshToken } = response;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            setUser(userData);

            toast.success(`Chào mừng trở lại, ${userData.fullName}! 📚`);
        } catch (error: any) {
            const message = error.response?.data?.error?.message || 'Đăng nhập thất bại';
            toast.error(message);
            throw error;
        }
    };

    const register = async (fullName: string, email: string, password: string) => {
        try {
            const response = await apiClient.register(fullName, email, password);
            const { user: userData, accessToken, refreshToken } = response;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            setUser(userData);

            toast.success(`Chào mừng ${userData.fullName}! Tài khoản đã được tạo thành công 🎉`);
        } catch (error: any) {
            const message = error.response?.data?.error?.message || 'Đăng ký thất bại';
            toast.error(message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        toast.success('Đã đăng xuất thành công');
    };

    const updateProfile = async (profileData: { fullName?: string; email?: string }): Promise<void> => {
        try {
            const response = await apiClient.updateProfile(profileData);
            setUser(response.user);
        } catch (error) {
            console.error('Profile update failed:', error);
            throw error;
        }
    };

    const updateUser = (userData: User) => {
        setUser(userData);
    };

    const value = {
        user,
        login,
        register,
        logout,
        updateProfile,
        updateUser,
        isLoading,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
