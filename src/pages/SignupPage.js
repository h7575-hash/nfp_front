import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StripePaymentForm from '../components/StripePaymentForm';
import './SignupPage.css';

const SignupPage = () => {
    const { t } = useTranslation('pages');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        purpose: '',
        industry: '',
        occupation: '',
        position: '',
        birth_year: '',
        agreeToTerms: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [showGoogleForm, setShowGoogleForm] = useState(false);
    const [googleUserInfo, setGoogleUserInfo] = useState(null);
    const [googleClientId, setGoogleClientId] = useState('');
    const [showPaymentStep, setShowPaymentStep] = useState(false);
    const [validatedUserData, setValidatedUserData] = useState(null);
    const [createdUser, setCreatedUser] = useState(null);

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





    // Google OAuth処理
    const handleGoogleSignup = async () => {
        console.log('=== Google OAuth 開始 ===');
        console.log('Client ID:', googleClientId);
        console.log('Current URL:', window.location.href);
        console.log('Domain:', window.location.hostname);
        
        if (!googleClientId) {
            console.error('Google Client ID is not loaded yet');
            alert('設定の読み込み中です。しばらく待ってからお試しください。');
            return;
        }

        if (!window.google) {
            console.error('Google Sign-In API が読み込まれていません');
            alert('Google Sign-In APIが読み込まれていません。');
            return;
        }

        console.log('Google API loaded:', {
            google: !!window.google,
            accounts: !!window.google.accounts,
            oauth2: !!window.google.accounts.oauth2,
            initTokenClient: !!window.google.accounts.oauth2.initTokenClient
        });

        try {
            // Google Identity Services (GIS) を使用
            console.log('TokenClient 初期化開始...');
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: googleClientId,
                scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
                callback: async (response) => {
                    console.log('=== OAuth Callback 開始 ===');
                    console.log('Response received:', response);
                    
                    if (response.error) {
                        console.error('OAuth Response Error:', response.error);
                        console.error('Error description:', response.error_description);
                        alert(`OAuth認証エラー: ${response.error} - ${response.error_description || ''}`);
                        return;
                    }

                    if (response.access_token) {
                        console.log('Access token received, length:', response.access_token.length);
                        try {
                            // Googleユーザー情報を取得
                            console.log('ユーザー情報取得開始...');
                            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
                            console.log('User info response status:', userInfoResponse.status);
                            
                            if (!userInfoResponse.ok) {
                                throw new Error(`User info API failed: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
                            }
                            
                            const userInfo = await userInfoResponse.json();
                            console.log('User info received:', { 
                                email: userInfo.email, 
                                name: userInfo.name, 
                                verified_email: userInfo.verified_email 
                            });

                            if (userInfo.email) {
                                setGoogleUserInfo({
                                    ...userInfo,
                                    access_token: response.access_token
                                });
                                setShowGoogleForm(true);
                                console.log('=== Google OAuth 成功 ===');
                            } else {
                                throw new Error('メールアドレスが取得できませんでした');
                            }
                        } catch (error) {
                            console.error('ユーザー情報取得エラー:', error);
                            console.error('Error stack:', error.stack);
                            alert(`ユーザー情報の取得に失敗しました: ${error.message}`);
                        }
                    } else {
                        console.error('Access token not received in response:', response);
                        alert('アクセストークンが取得できませんでした。');
                    }
                },
                error_callback: (error) => {
                    console.error('=== Google OAuth Error Callback ===');
                    console.error('Error object:', error);
                    console.error('Error type:', typeof error);
                    console.error('Error properties:', Object.keys(error || {}));
                    if (error) {
                        console.error('Error message:', error.message);
                        console.error('Error code:', error.code);
                        console.error('Error details:', error.details);
                    }
                    alert(`Google認証に失敗しました: ${error?.message || JSON.stringify(error)}`);
                }
            });

            console.log('TokenClient created:', !!client);
            console.log('TokenClient methods:', Object.keys(client || {}));

            // OAuth認証開始
            console.log('requestAccessToken 呼び出し開始...');
            client.requestAccessToken();
            console.log('requestAccessToken 呼び出し完了');

        } catch (error) {
            console.error('=== Google OAuth 初期化エラー ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Error name:', error.name);
            alert(`Google認証の初期化に失敗しました: ${error.message}`);
        }
    };

    // Google OAuth登録処理（サーバーサイド経由）
    const handleGoogleFormSubmit = async (e) => {
        e.preventDefault();

        if (!validateGoogleForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // ユーザーデータを準備（Googleアカウント情報含む）
            const userData = {
                email: googleUserInfo.email,
                purpose: formData.purpose,
                industry: formData.industry,
                occupation: formData.occupation,
                position: formData.position,
                birth_year: formData.birth_year,
                social_login: {
                    service: 'google',
                    token: googleUserInfo.access_token
                }
            };

            // Googleユーザーを作成（OAuth専用エンドポイント）
            const userCreateResponse = await fetch('/api/users/register-google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_token: googleUserInfo.access_token,
                    purpose: formData.purpose,
                    industry: formData.industry,
                    occupation: formData.occupation,
                    position: formData.position,
                    birth_year: formData.birth_year,
                    plan: 'free'
                }),
            });

            const userCreateResult = await userCreateResponse.json();

            if (!userCreateResponse.ok) {
                throw new Error(userCreateResult.error || 'ユーザー作成に失敗しました');
            }

            const user_id = userCreateResult.user_id;
            
            // ユーザー情報をセット（通常フローと同じように電話認証ステップへ）
            setValidatedUserData(userData);
            setCreatedUser({
                user_id: user_id,
                email: userData.email,
                status: 'pending'
            });
            setShowGoogleForm(false); // Googleフォームを閉じる
            setShowPaymentStep(true); // 決済ステップに移動

        } catch (error) {
            console.error('Google登録エラー:', error);
            alert(`${t('signup.errors.registrationFailed')}: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Google OAuth用のフォームバリデーション
    const validateGoogleForm = () => {
        const newErrors = {};

        // Google OAuth必須項目チェック
        if (!formData.purpose) newErrors.purpose = t('signup.validation.purposeRequired');
        if (!formData.birth_year) newErrors.birth_year = '生年は必須です';
        
        // 業種・職種チェック（ビジネスまたは両方の場合のみ必須）
        if (formData.purpose === 'business' || formData.purpose === 'both') {
            if (!formData.industry) newErrors.industry = t('signup.validation.industryRequired');
            if (!formData.occupation) newErrors.occupation = t('signup.validation.occupationRequired');
        }
        
        // ビジネス情報チェック（ビジネスまたは両方の場合）
        if (formData.purpose === 'business' || formData.purpose === 'both') {
            if (!formData.position) newErrors.position = '役職は必須です';
        }
        
        if (formData.birth_year) {
            const currentYear = new Date().getFullYear();
            const birthYear = parseInt(formData.birth_year);

            if (birthYear > currentYear) {
                newErrors.birth_year = '未来の年は選択できません';
            } else if (birthYear < 1900) {
                newErrors.birth_year = '有効な年を入力してください';
            }
        }

        // 利用規約同意チェック
        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = t('signup.validation.termsRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 選択肢データ
    const purposeOptions = [
        { value: 'private', label: t('signup.purposes.private') },
        { value: 'business', label: t('signup.purposes.business') },
        { value: 'both', label: t('signup.purposes.both') }
    ];

    const industryOptions = [
        { value: 'tech', label: t('signup.industries.tech') },
        { value: 'finance', label: t('signup.industries.finance') },
        { value: 'manufacturing', label: t('signup.industries.manufacturing') },
        { value: 'healthcare', label: t('signup.industries.healthcare') },
        { value: 'retail', label: t('signup.industries.retail') },
        { value: 'education', label: t('signup.industries.education') },
        { value: 'consulting', label: t('signup.industries.consulting') },
        { value: 'media', label: t('signup.industries.media') },
        { value: 'logistics', label: t('signup.industries.logistics') },
        { value: 'construction', label: t('signup.industries.construction') },
        { value: 'government', label: t('signup.industries.government') },
        { value: 'other', label: t('signup.industries.other') }
    ];

    const occupationOptions = [
        { value: 'engineer', label: t('signup.occupations.engineer') },
        { value: 'designer', label: t('signup.occupations.designer') },
        { value: 'manager', label: t('signup.occupations.manager') },
        { value: 'consultant', label: t('signup.occupations.consultant') },
        { value: 'researcher', label: t('signup.occupations.researcher') },
        { value: 'sales', label: t('signup.occupations.sales') },
        { value: 'marketing', label: t('signup.occupations.marketing') },
        { value: 'hr', label: t('signup.occupations.hr') },
        { value: 'finance', label: t('signup.occupations.finance') },
        { value: 'student', label: t('signup.occupations.student') },
        { value: 'freelancer', label: t('signup.occupations.freelancer') },
        { value: 'other', label: t('signup.occupations.other') }
    ];


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // エラーをクリア
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Google OAuth必須項目チェック（統合）
        if (!formData.purpose) newErrors.purpose = t('signup.validation.purposeRequired');
        if (!formData.birth_year) newErrors.birth_year = '生年は必須です';
        
        
        // 業種・職種チェック（ビジネスまたは両方の場合のみ必須）
        if (formData.purpose === 'business' || formData.purpose === 'both') {
            if (!formData.industry) newErrors.industry = t('signup.validation.industryRequired');
            if (!formData.occupation) newErrors.occupation = t('signup.validation.occupationRequired');
        }
        
        // ビジネス情報チェック（ビジネスまたは両方の場合）
        if (formData.purpose === 'business' || formData.purpose === 'both') {
            if (!formData.position) newErrors.position = '役職は必須です';
        }
        if (formData.birth_year) {
            const currentYear = new Date().getFullYear();
            const birthYear = parseInt(formData.birth_year);

            if (birthYear > currentYear) {
                newErrors.birth_year = '未来の年は選択できません';
            } else if (birthYear < 1900) {
                newErrors.birth_year = '有効な年を入力してください';
            }
        }



        // 利用規約同意チェック
        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = t('signup.validation.termsRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    // 決済成功時の処理
    const handlePaymentSuccess = (result) => {
        console.log('Payment successful:', result);
        setSuccessMessage(result.message || 'アカウントが正常に作成されました');
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 2000);
    };

    // 決済エラー時の処理
    const handlePaymentError = (error) => {
        console.error('Payment error:', error);
        alert(`決済処理エラー: ${error}`);
        // エラー時は決済ステップに戻る
        setShowPaymentStep(false);
        setValidatedUserData(null);
    };

    // 各ステップから戻る処理
    const handleBackToForm = () => {
        setShowPaymentStep(false);
        setValidatedUserData(null);
        setCreatedUser(null);
        setShowGoogleForm(false);
    };



    // 決済ステップの表示
    if (showPaymentStep && validatedUserData && createdUser) {
        return (
            <div className="signup-container">
                <div className="signup-card">
                    <div className="signup-header">
                        <button 
                            type="button" 
                            onClick={handleBackToForm}
                            className="back-button"
                        >
                            ← 戻る
                        </button>
                        <h1>決済情報の入力</h1>
                        <p>登録を完了するために決済情報を入力してください</p>
                    </div>

                    {/* 成功メッセージ */}
                    {successMessage && (
                        <div className="success-message">
                            <div className="success-content">
                                <span className="success-icon">✓</span>
                                <span className="success-text">{successMessage}</span>
                            </div>
                        </div>
                    )}

                    <StripePaymentForm 
                        userData={{...validatedUserData, user_id: createdUser.user_id}}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="signup-container">
            <div className="signup-card">
                <div className="signup-header">
                    <h1>{t('signup.title')}</h1>
                    <p>{t('signup.subtitle')}</p>
                </div>

                {/* 成功メッセージ */}
                {successMessage && (
                    <div className="success-message">
                        <div className="success-content">
                            <span className="success-icon">✓</span>
                            <span className="success-text">{successMessage}</span>
                        </div>
                    </div>
                )}

                {showGoogleForm ? (
                    // Google OAuth登録フォーム
                    <div className="google-signup-form">
                        <div className="google-user-info">
                            <img src={googleUserInfo.picture} alt="Profile" className="google-avatar" />
                            <h3>{googleUserInfo.name}</h3>
                            <p>{googleUserInfo.email}</p>
                            <button type="button" onClick={() => setShowGoogleForm(false)} className="btn-back">
                                {t('signup.form.backToNormal')}
                            </button>
                        </div>

                        <form onSubmit={handleGoogleFormSubmit} className="signup-form">
                            {/* 生年 */}
                            <div className="form-group">
                                <label htmlFor="birth_year">生年 *</label>
                                <select
                                    id="birth_year"
                                    name="birth_year"
                                    value={formData.birth_year}
                                    onChange={handleChange}
                                    className={`form-input ${errors.birth_year ? 'error' : ''}`}
                                >
                                    <option value="">年を選択してください</option>
                                    {Array.from({length: 75}, (_, i) => {
                                        const year = new Date().getFullYear() - i;
                                        return <option key={year} value={year}>{year}年</option>
                                    })}
                                </select>
                                {errors.birth_year && <span className="error-message">{errors.birth_year}</span>}
                            </div>

                            {/* 利用目的 */}
                            <div className="form-group">
                                <label htmlFor="purpose">{t('signup.form.purpose')} *</label>
                                <select
                                    id="purpose"
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleChange}
                                    className={`form-input ${errors.purpose ? 'error' : ''}`}
                                >
                                    <option value="">{t('signup.form.selectPlaceholder')}</option>
                                    {purposeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.purpose && <span className="error-message">{errors.purpose}</span>}
                            </div>

                            {/* 業種・職種（ビジネスまたは両方の場合のみ表示） */}
                            {(formData.purpose === 'business' || formData.purpose === 'both') && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="industry">{t('signup.form.industry')} *</label>
                                        <select
                                            id="industry"
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleChange}
                                            className={`form-input ${errors.industry ? 'error' : ''}`}
                                        >
                                            <option value="">{t('signup.form.selectPlaceholder')}</option>
                                            {industryOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.industry && <span className="error-message">{errors.industry}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="occupation">{t('signup.form.occupation')} *</label>
                                        <select
                                            id="occupation"
                                            name="occupation"
                                            value={formData.occupation}
                                            onChange={handleChange}
                                            className={`form-input ${errors.occupation ? 'error' : ''}`}
                                        >
                                            <option value="">{t('signup.form.selectPlaceholder')}</option>
                                            {occupationOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.occupation && <span className="error-message">{errors.occupation}</span>}
                                    </div>
                                </div>
                            )}

                            {/* ビジネス情報（ビジネスまたは両方の場合のみ表示） */}
                            {(formData.purpose === 'business' || formData.purpose === 'both') && (
                                <div className="business-fields">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="position">役職 *</label>
                                            <select
                                                id="position"
                                                name="position"
                                                value={formData.position}
                                                onChange={handleChange}
                                                className={`form-input ${errors.position ? 'error' : ''}`}
                                            >
                                                <option value="">選択してください</option>
                                                <option value="代表取締役">代表取締役</option>
                                                <option value="取締役">取締役</option>
                                                <option value="執行役員">執行役員</option>
                                                <option value="部長">部長</option>
                                                <option value="課長">課長</option>
                                                <option value="係長">係長</option>
                                                <option value="主任">主任</option>
                                                <option value="チームリーダー">チームリーダー</option>
                                                <option value="マネージャー">マネージャー</option>
                                                <option value="一般社員">一般社員</option>
                                                <option value="契約社員">契約社員</option>
                                                <option value="派遣社員">派遣社員</option>
                                                <option value="アルバイト・パート">アルバイト・パート</option>
                                                <option value="インターン">インターン</option>
                                                <option value="その他">その他</option>
                                            </select>
                                            {errors.position && <span className="error-message">{errors.position}</span>}
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* 利用規約同意 */}
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="agreeToTerms"
                                        checked={formData.agreeToTerms}
                                        onChange={handleChange}
                                        className={errors.agreeToTerms ? 'error' : ''}
                                    />
                                    <span className="checkmark"></span>
                                    <span className="checkbox-text">
                                        {t('signup.form.termsAgree')}
                                        <a href="https://sage-metal-8c6.notion.site/25913b91bf6c800dae0bccec86de54de" target="_blank" rel="noopener noreferrer" className="terms-link">
                                            {t('signup.form.termsLink')}
                                        </a>
                                        {t('signup.form.and')}
                                        <a href="https://sage-metal-8c6.notion.site/25913b91bf6c80a783cae4826e447291" target="_blank" rel="noopener noreferrer" className="terms-link">
                                            {t('signup.form.privacyLink')}
                                        </a>
                                    </span>
                                </label>
                                {errors.agreeToTerms && <span className="error-message">{errors.agreeToTerms}</span>}
                            </div>

                            <button 
                                type="submit" 
                                className={`btn btn-primary signup-btn ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="spinner"></div>
                                        {t('signup.form.submitting')}
                                    </>
                                ) : (
                                    `${t('signup.form.submit')} (Google)`
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    // ソーシャルログイン専用
                    <div className="social-signup-only">
                        <button
                            type="button"
                            className={`btn btn-google google-signin-btn large ${isLoading ? 'loading' : ''}`}
                            onClick={handleGoogleSignup}
                            disabled={isLoading}
                        >
                            <svg className="google-icon" width="24" height="24" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Googleでアカウント作成
                        </button>

                        <div className="future-social-options">
                            <p className="coming-soon">今後対応予定:</p>
                            <div className="social-buttons-disabled">
                                <button className="btn btn-line disabled" disabled>
                                    <span className="line-icon">LINE</span>
                                    LINEログイン（準備中）
                                </button>
                                <button className="btn btn-apple disabled" disabled>
                                    <span className="apple-icon">🍎</span>
                                    Appleログイン（準備中）
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="signup-footer">
                    <p>
                        {t('signup.footer.hasAccount')}
                        <Link to="/login" className="login-link">
                            {t('signup.footer.loginLink')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;