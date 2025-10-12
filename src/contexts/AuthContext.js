import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    // 初期化時にローカルストレージからトークンを復元
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const savedToken = localStorage.getItem('authToken');
                const savedUser = localStorage.getItem('userInfo');
                
                if (savedToken && savedUser) {
                    setToken(savedToken);
                    setUser(JSON.parse(savedUser));
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);


    // Googleログイン関数
    const googleLogin = async (idToken) => {
        try {
            setLoading(true);
            
            const response = await fetch('/api/auth/login-google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Googleログインに失敗しました');
            }

            const { token: newToken, user: userData } = data;
            
            setToken(newToken);
            setUser(userData);
            
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('userInfo', JSON.stringify(userData));
            
            return { success: true, user: userData };
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    // ログアウト関数
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        
        // セッションストレージもクリア
        sessionStorage.clear();
    };

    // ユーザー情報更新関数
    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('userInfo', JSON.stringify(userData));
    };

    // 認証されたAPIリクエスト用のヘッダーを取得
    const getAuthHeaders = () => {
        if (!token) return {};
        
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    // 認証されたfetchリクエスト
    const authenticatedFetch = async (url, options = {}) => {
        const authHeaders = getAuthHeaders();
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...authHeaders,
                ...options.headers,
            },
        });

        // トークンが無効な場合は自動ログアウト
        if (response.status === 401) {
            logout();
            throw new Error('認証が必要です。再度ログインしてください。');
        }

        return response;
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        googleLogin,
        logout,
        updateUser,
        getAuthHeaders,
        authenticatedFetch,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};