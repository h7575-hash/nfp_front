import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const { t } = useTranslation('pages');
    const navigate = useNavigate();
    const { googleLogin } = useAuth();
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
                    <p className="login-subtitle">{t('login.subtitle')}</p>
                </div>

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

                {/* Google Sign-In ボタンコンテナ */}
                <div id="google-signin-button" style={{ display: 'none' }}></div>
                <button className="btn btn-social google-login" onClick={handleGoogleLogin}>
                    {t('login.social.googleLogin')}
                </button>

                <div className="login-footer">
                    <p>
                        {t('login.footer.noAccount')}
                        <Link to="/signup" className="register-link">
                            {t('login.footer.signupLink')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;