import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PhoneVerificationPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, updateUser } = useAuth();
    
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationStep, setVerificationStep] = useState('input'); // 'input', 'verify', 'verified'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // ユーザーがログインしていない場合はログインページにリダイレクト
    React.useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
    }, [user, navigate]);

    // 電話番号の国際フォーマットへの変換
    const formatPhoneNumber = (phone) => {
        let formatted = phone.trim();
        if (formatted.startsWith('0')) {
            formatted = '+81' + formatted.slice(1);
        } else if (!formatted.startsWith('+')) {
            formatted = '+81' + formatted;
        }
        return formatted;
    };

    // SMS認証コード送信
    const sendVerificationCode = async () => {
        if (!phoneNumber) {
            setError('電話番号を入力してください');
            return;
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/send-phone-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: formattedPhone,
                    user_id: user.user_id
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setVerificationStep('verify');
                setSuccessMessage(`認証コードを ${formattedPhone} に送信しました`);
                setPhoneNumber(formattedPhone); // フォーマットした番号を保存
            } else {
                setError(result.error || '認証コードの送信に失敗しました');
            }
        } catch (error) {
            console.error('Phone verification send error:', error);
            setError('ネットワークエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    // 認証コードを検証
    const verifyCode = async () => {
        if (!verificationCode) {
            setError('認証コードを入力してください');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-phone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // HttpOnlyクッキー用
                body: JSON.stringify({
                    verification_code: verificationCode,
                    user_id: user.user_id
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setVerificationStep('verified');
                setSuccessMessage('電話番号が正常に認証されました');
                
                // ユーザー情報を更新
                const updatedUser = {
                    ...user,
                    phone_number: phoneNumber,
                    phone_verified: true
                };
                updateUser(updatedUser);

                // 3秒後に次のページへ遷移
                setTimeout(() => {
                    // カード登録ページまたはホームページに遷移
                    const from = location.state?.from?.pathname || '/';
                    navigate(from, { replace: true });
                }, 3000);
            } else {
                setError(result.error || '認証コードの検証に失敗しました');
            }
        } catch (error) {
            console.error('Phone verification error:', error);
            setError('ネットワークエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    // 電話番号を変更
    const changePhoneNumber = () => {
        setVerificationStep('input');
        setVerificationCode('');
        setError('');
        setSuccessMessage('');
    };

    // スキップ（後で設定）
    const skipVerification = () => {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
    };

    if (!user) {
        return null; // ロード中またはリダイレクト中
    }

    return (
        <div className="phone-verification-container">
            <div className="verification-card">
                <div className="verification-header">
                    <h1>電話番号認証</h1>
                    <p>アカウントのセキュリティ向上のため、電話番号の認証をお願いします</p>
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

                {successMessage && (
                    <div className="success-message" style={{
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        marginBottom: '1rem',
                        border: '1px solid #bbf7d0'
                    }}>
                        {successMessage}
                    </div>
                )}

                {verificationStep === 'input' && (
                    <div className="phone-input-step">
                        <div className="form-group">
                            <label htmlFor="phoneNumber">電話番号</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="090-1234-5678"
                                className="form-input"
                            />
                        </div>
                        <button
                            onClick={sendVerificationCode}
                            disabled={isLoading || !phoneNumber}
                            className="btn btn-primary"
                        >
                            {isLoading ? '送信中...' : '認証コード送信'}
                        </button>
                    </div>
                )}

                {verificationStep === 'verify' && (
                    <div className="code-input-step">
                        <p>認証コードを <strong>{phoneNumber}</strong> に送信しました</p>
                        <div className="form-group">
                            <label htmlFor="verificationCode">認証コード</label>
                            <input
                                type="text"
                                id="verificationCode"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="6桁の認証コード"
                                maxLength="6"
                                className="form-input"
                            />
                        </div>
                        <div className="button-group">
                            <button
                                onClick={verifyCode}
                                disabled={isLoading || !verificationCode}
                                className="btn btn-primary"
                            >
                                {isLoading ? '検証中...' : '認証する'}
                            </button>
                            <button
                                onClick={changePhoneNumber}
                                className="btn-link"
                            >
                                電話番号を変更
                            </button>
                        </div>
                    </div>
                )}

                {verificationStep === 'verified' && (
                    <div className="success-step">
                        <div className="success-icon">✓</div>
                        <h2>認証完了</h2>
                        <p>電話番号の認証が正常に完了しました</p>
                        <p className="redirect-message">3秒後に自動的に次のページに進みます...</p>
                    </div>
                )}

                <div className="verification-footer">
                    <button
                        onClick={skipVerification}
                        className="btn-link"
                    >
                        後で設定する
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhoneVerificationPage;