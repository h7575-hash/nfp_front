import React, { useState, useEffect } from 'react';
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
    const [googleClientId, setGoogleClientId] = useState('');

    // 設定を取得
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/config');
                const config = await response.json();
                console.log('Google Client ID loaded from config:', config.googleClientId);
                setGoogleClientId(config.googleClientId);
            } catch (error) {
                console.error('Failed to fetch config:', error);
                // フォールバック：環境変数から取得（ビルド時の値）
                const fallbackId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
                console.log('Using fallback Google Client ID:', fallbackId);
                setGoogleClientId(fallbackId);
            }
        };
        fetchConfig();
    }, []);

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

        if (!googleClientId) {
            setError('Google Client IDが設定されていません。');
            return;
        }

        try {
            // Google Identity Services の credential response を使用
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: async (response) => {
                    try {
                        if (response.credential) {
                            // response.credential にID Tokenが含まれている
                            const result = await googleLogin(response.credential);
                            
                            if (result.success) {
                                navigate('/', { replace: true });
                            } else {
                                setError(result.error || 'Googleログインに失敗しました');
                            }
                        } else {
                            setError('Google認証でID Tokenが取得できませんでした');
                        }
                    } catch (error) {
                        console.error('Google login error:', error);
                        setError('Googleログインの処理中にエラーが発生しました');
                    }
                },
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // ワンタップ認証を表示
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    // ワンタップが表示されない場合は、ポップアップを使用
                    window.google.accounts.id.renderButton(
                        document.getElementById('google-signin-button'),
                        {
                            theme: 'outline',
                            size: 'large',
                            width: '100%'
                        }
                    );
                }
            });
        } catch (error) {
            console.error('Google Identity Services initialization error:', error);
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
                    {/* Google Sign-In ボタンコンテナ */}
                    <div id="google-signin-button" style={{ display: 'none' }}></div>
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