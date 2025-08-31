import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const { t } = useTranslation('pages');
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // エラーをクリア
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            const result = await login(formData.email, formData.password);
            
            if (result.success) {
                // ログイン成功時にホームページへリダイレクト
                navigate('/', { replace: true });
            } else {
                // エラーメッセージを表示
                setError(result.error || 'ログインに失敗しました');
            }
        } catch (error) {
            console.error('ログインエラー:', error);
            setError('ネットワークエラーが発生しました。しばらくしてから再度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        if (!window.google) {
            setError('Google Sign-In APIが読み込まれていません。');
            return;
        }

        try {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
                callback: async (response) => {
                    if (response.error) {
                        setError(`Google認証エラー: ${response.error}`);
                        return;
                    }

                    if (response.access_token) {
                        try {
                            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
                            const userInfo = await userInfoResponse.json();
                            
                            if (userInfo.email) {
                                const result = await googleLogin(userInfo.id_token || response.access_token);
                                
                                if (result.success) {
                                    navigate('/', { replace: true });
                                } else {
                                    setError(result.error || 'Googleログインに失敗しました');
                                }
                            }
                        } catch (error) {
                            setError('ユーザー情報の取得に失敗しました');
                        }
                    }
                },
                error_callback: (error) => {
                    setError(`Google認証に失敗しました: ${error?.message || error}`);
                }
            });

            client.requestAccessToken();
        } catch (error) {
            setError('Google認証の初期化に失敗しました');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>{t('login.title')}</h1>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message" style={{
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            border: '1px solid #fecaca'
                        }}>
                            {error}
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="email">{t('login.form.email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder={t('login.form.emailPlaceholder')}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('login.form.password')}</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder={t('login.form.passwordPlaceholder')}
                            className="form-input"
                        />
                    </div>

                    <div className="form-options">
                        <label className="checkbox-label">
                            <input type="checkbox" />
                            <span className="checkmark"></span>
                            {t('login.form.rememberMe')}
                        </label>
                        <Link to="/forgot-password" className="forgot-link">
                            {t('login.form.forgotPassword')}
                        </Link>
                    </div>

                    <button 
                        type="submit" 
                        className={`btn btn-primary login-btn ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                {t('login.form.submitting')}
                            </>
                        ) : (
                            t('login.form.submit')
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {t('login.footer.noAccount')} 
                        <Link to="/signup" className="register-link">
                            {t('login.footer.signupLink')}
                        </Link>
                    </p>
                </div>

                {/* ソーシャルログイン（オプション） */}
                <div className="social-login">
                    <div className="divider">
                        <span>{t('login.social.divider')}</span>
                    </div>
                    <button className="btn btn-social google-login" onClick={handleGoogleLogin}>
                        <span className="social-icon">🔍</span>
                        {t('login.social.googleLogin')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;