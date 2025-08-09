import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        // ログイン処理をここに実装
        try {
            console.log('ログイン処理:', formData);
            // API呼び出し処理
            await new Promise(resolve => setTimeout(resolve, 1000)); // 仮の待機
            // 成功時の処理（リダイレクトなど）
        } catch (error) {
            console.error('ログインエラー:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>ログイン</h1>
                    <p>News dogにアクセスするためにログインしてください</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">メールアドレス</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="your@email.com"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">パスワード</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="パスワードを入力"
                            className="form-input"
                        />
                    </div>

                    <div className="form-options">
                        <label className="checkbox-label">
                            <input type="checkbox" />
                            <span className="checkmark"></span>
                            ログイン状態を保持する
                        </label>
                        <Link to="/forgot-password" className="forgot-link">
                            パスワードをお忘れですか？
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
                                ログイン中...
                            </>
                        ) : (
                            'ログイン'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        アカウントをお持ちでないですか？ 
                        <Link to="/register" className="register-link">
                            新規登録
                        </Link>
                    </p>
                </div>

                {/* ソーシャルログイン（オプション） */}
                <div className="social-login">
                    <div className="divider">
                        <span>または</span>
                    </div>
                    <button className="btn btn-social google-login">
                        <span className="social-icon">🔍</span>
                        Googleでログイン
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;