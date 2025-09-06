import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './StripePaymentForm.css';

const PhoneVerificationForm = ({ userData, onSuccess, onError }) => {
    const { t } = useTranslation('pages');
    const [phoneFormData, setPhoneFormData] = useState({
        phone_number: '',
        verification_code: ''
    });
    const [phoneVerificationStep, setPhoneVerificationStep] = useState('input'); // 'input', 'verify'
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    // 電話番号フォームの変更処理
    const handlePhoneChange = (e) => {
        const { name, value } = e.target;
        setPhoneFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // エラーをクリア
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

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
    const sendPhoneVerification = async () => {
        if (!phoneFormData.phone_number) {
            setErrors(prev => ({ ...prev, phone_number: '電話番号を入力してください' }));
            return;
        }

        const formattedPhone = formatPhoneNumber(phoneFormData.phone_number);
        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/auth/send-phone-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: formattedPhone,
                    user_id: userData.user_id
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setPhoneVerificationStep('verify');
                setPhoneFormData(prev => ({ ...prev, phone_number: formattedPhone }));
                setSuccessMessage(`認証コードを ${formattedPhone} に送信しました`);
            } else {
                setErrors(prev => ({ 
                    ...prev, 
                    phone_number: result.error || '認証コードの送信に失敗しました' 
                }));
            }
        } catch (error) {
            console.error('Phone verification send error:', error);
            setErrors(prev => ({ 
                ...prev, 
                phone_number: 'ネットワークエラーが発生しました' 
            }));
        } finally {
            setIsLoading(false);
        }
    };

    // 認証コードを検証
    const verifyPhoneCode = async () => {
        if (!phoneFormData.verification_code) {
            setErrors(prev => ({ ...prev, verification_code: '認証コードを入力してください' }));
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/auth/verify-phone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    verification_code: phoneFormData.verification_code,
                    user_id: userData.user_id
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                onSuccess({
                    type: 'phone_verification',
                    message: '電話番号が正常に認証されました',
                    phone_number: phoneFormData.phone_number,
                    data: result
                });
            } else {
                setErrors(prev => ({ 
                    ...prev, 
                    verification_code: result.error || '認証コードの検証に失敗しました' 
                }));
            }
        } catch (error) {
            console.error('Phone verification error:', error);
            setErrors(prev => ({ 
                ...prev, 
                verification_code: 'ネットワークエラーが発生しました' 
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="payment-form">
            {/* エラーメッセージ */}
            {(errors.phone_number || errors.verification_code) && (
                <div className="error-message" style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    border: '1px solid #fecaca'
                }}>
                    {errors.phone_number || errors.verification_code}
                </div>
            )}

            {/* 成功メッセージ */}
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

            <form onSubmit={(e) => e.preventDefault()} className="stripe-form">
                {phoneVerificationStep === 'input' && (
                    <div className="phone-input-step">
                        <h3>電話番号の入力</h3>
                        <div className="form-group">
                            <label htmlFor="phone_number">電話番号</label>
                            <input
                                type="tel"
                                id="phone_number"
                                name="phone_number"
                                value={phoneFormData.phone_number}
                                onChange={handlePhoneChange}
                                placeholder="090-1234-5678"
                                className={`form-input ${errors.phone_number ? 'error' : ''}`}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={sendPhoneVerification}
                            disabled={isLoading || !phoneFormData.phone_number}
                            className={`btn btn-primary signup-btn ${isLoading ? 'loading' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    送信中...
                                </>
                            ) : (
                                '認証コード送信'
                            )}
                        </button>
                    </div>
                )}
                
                {phoneVerificationStep === 'verify' && (
                    <div className="phone-verify-step">
                        <h3>認証コードの入力</h3>
                        <p>認証コードを <strong>{phoneFormData.phone_number}</strong> に送信しました</p>
                        <div className="form-group">
                            <label htmlFor="verification_code">認証コード</label>
                            <input
                                type="text"
                                id="verification_code"
                                name="verification_code"
                                value={phoneFormData.verification_code}
                                onChange={handlePhoneChange}
                                placeholder="6桁の認証コード"
                                maxLength="6"
                                className={`form-input ${errors.verification_code ? 'error' : ''}`}
                            />
                        </div>
                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={verifyPhoneCode}
                                disabled={isLoading || !phoneFormData.verification_code}
                                className={`btn btn-primary signup-btn ${isLoading ? 'loading' : ''}`}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner"></div>
                                        認証中...
                                    </>
                                ) : (
                                    '認証する'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setPhoneVerificationStep('input')}
                                className="btn btn-secondary"
                            >
                                戻る
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

// 親コンポーネント（StripePaymentFormと同じパターン）
const PhoneVerificationFormWrapper = ({ userData, onSuccess, onError }) => {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="stripe-container">
            <PhoneVerificationForm
                userData={userData}
                onSuccess={onSuccess}
                onError={onError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
            />
        </div>
    );
};

export default PhoneVerificationFormWrapper;