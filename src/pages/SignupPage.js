import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './SignupPage.css';

const SignupPage = () => {
    const { t } = useTranslation('pages');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        purpose: '',
        industry: '',
        occupation: '',
        birth_date: '',
        plan: 'free',
        agreeToTerms: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showGoogleForm, setShowGoogleForm] = useState(false);
    const [googleUserInfo, setGoogleUserInfo] = useState(null);
    const [googleClientId, setGoogleClientId] = useState('');

    // 設定を取得
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();
                console.log('Config loaded:', config);
                setGoogleClientId(config.GOOGLE_CLIENT_ID || '');
            } catch (error) {
                console.error('Failed to load config:', error);
            }
        };
        
        fetchConfig();
    }, []);

    // デバイスフィンガープリントを生成する関数
    const generateDeviceFingerprint = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        const canvasFingerprint = canvas.toDataURL();

        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            window.screen.width + 'x' + window.screen.height,
            window.screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.platform,
            navigator.cookieEnabled,
            canvasFingerprint
        ].join('|');

        // ハッシュ化して短縮
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'fp_' + Math.abs(hash).toString(36);
    };

    // デバイスIDとIPアドレスを取得する関数
    const getDeviceInfo = async () => {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            // より永続的なデバイスフィンガープリントを生成
            deviceId = generateDeviceFingerprint();
            localStorage.setItem('deviceId', deviceId);
        }

        let ipAddress = '';
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            ipAddress = data.ip;
        } catch (error) {
            console.warn('IP address取得に失敗:', error);
        }

        return { deviceId, ipAddress };
    };

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
            // デバイス情報を取得
            const { deviceId, ipAddress } = await getDeviceInfo();

            // サーバーサイドGoogle OAuth登録API呼び出し
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_token: googleUserInfo.access_token,
                    purpose: formData.purpose,
                    industry: formData.industry,
                    occupation: formData.occupation,
                    birth_date: formData.birth_date,
                    plan: formData.plan,
                    device_id: deviceId,
                    ip_address: ipAddress
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`${t('signup.success.registered')} (${result.email})`);
                // 成功時の処理
                // window.location.href = '/login';
            } else {
                throw new Error(result.error || `Registration failed (Status: ${response.status})`);
            }

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
        if (!formData.industry) newErrors.industry = t('signup.validation.industryRequired');
        if (!formData.occupation) newErrors.occupation = t('signup.validation.occupationRequired');
        if (!formData.birth_date) newErrors.birth_date = t('signup.validation.birthDateRequired');
        
        if (formData.birth_date) {
            const birthDate = new Date(formData.birth_date);
            const today = new Date();
            
            if (birthDate > today) {
                newErrors.birth_date = t('signup.validation.futureDateNotAllowed');
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

        // 必須項目チェック
        if (!formData.email) newErrors.email = t('signup.validation.emailRequired');
        if (!formData.password) newErrors.password = t('signup.validation.passwordRequired');
        if (!formData.confirmPassword) newErrors.confirmPassword = t('signup.validation.confirmPasswordRequired');
        if (!formData.purpose) newErrors.purpose = t('signup.validation.purposeRequired');
        if (!formData.industry) newErrors.industry = t('signup.validation.industryRequired');
        if (!formData.occupation) newErrors.occupation = t('signup.validation.occupationRequired');
        if (!formData.birth_date) newErrors.birth_date = t('signup.validation.birthDateRequired');
        if (formData.birth_date) {
            const birthDate = new Date(formData.birth_date);
            const today = new Date();
            
            if (birthDate > today) {
                newErrors.birth_date = t('signup.validation.futureDateNotAllowed');
            }
        }

        // パスワード一致チェック
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('signup.validation.passwordMismatch');
        }

        // パスワード長チェック
        if (formData.password && formData.password.length < 8) {
            newErrors.password = t('signup.validation.passwordMinLength');
        }

        // メールフォーマットチェック
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = t('signup.validation.invalidEmail');
        }

        // 利用規約同意チェック
        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = t('signup.validation.termsRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        
        try {
            console.log('ユーザー登録処理:', formData);
            
            // デバイス情報を取得
            const { deviceId, ipAddress } = await getDeviceInfo();
            
            // プロキシ経由でAPIリクエスト送信
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    purpose: formData.purpose,
                    industry: formData.industry,
                    occupation: formData.occupation,
                    birth_date: formData.birth_date,
                    plan: formData.plan,
                    device_id: deviceId,
                    ip_address: ipAddress
                })
            });
            
            const result = await response.json();
            console.log('Response status:', response.status);
            console.log('Response data:', result);
            
            if (response.ok && result.success) {
                alert(t('signup.success.registered'));
                // 成功時の処理（ログインページへリダイレクトなど）
                // window.location.href = '/login';
            } else {
                throw new Error(result.error || `Registration failed (Status: ${response.status})`);
            }
            
        } catch (error) {
            console.error('登録エラー:', error);
            alert(`${t('signup.errors.registrationFailed')}: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <div className="signup-header">
                    <h1>{t('signup.title')}</h1>
                    <p>{t('signup.subtitle')}</p>
                </div>

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

                            {/* 業種・職種 */}
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

                            {/* 生年月日 */}
                            <div className="form-group">
                                <label htmlFor="birth_date">{t('signup.form.birthDate')} *</label>
                                <input
                                    type="date"
                                    id="birth_date"
                                    name="birth_date"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                    defaultValue="2020-01-01"
                                    max={new Date().toISOString().split('T')[0]}
                                    className={`form-input ${errors.birth_date ? 'error' : ''}`}
                                />
                                {errors.birth_date && <span className="error-message">{errors.birth_date}</span>}
                            </div>

                            {/* プラン選択 */}
                            <div className="form-group">
                                <label>{t('signup.form.plan')}</label>
                                <div className="plan-options">
                                    <label className="plan-option">
                                        <input
                                            type="radio"
                                            name="plan"
                                            value="free"
                                            checked={formData.plan === 'free'}
                                            onChange={handleChange}
                                        />
                                        <div className="plan-card">
                                            <h3>{t('signup.plans.free')}</h3>
                                            <p>{t('signup.plans.freeDescription')}</p>
                                            <div className="price">{t('signup.plans.freePrice')}</div>
                                        </div>
                                    </label>
                                    <label className="plan-option">
                                        <input
                                            type="radio"
                                            name="plan"
                                            value="premium"
                                            checked={formData.plan === 'premium'}
                                            onChange={handleChange}
                                        />
                                        <div className="plan-card">
                                            <h3>{t('signup.plans.premium')}</h3>
                                            <p>{t('signup.plans.premiumDescription')}</p>
                                            <div className="price">{t('signup.plans.premiumPrice')}</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

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
                                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="terms-link">
                                            {t('signup.form.termsLink')}
                                        </a>
                                        {t('signup.form.and')}
                                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="terms-link">
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
                    // 通常の登録フォーム
                    <form onSubmit={handleSubmit} className="signup-form">
                    {/* メールアドレス */}
                    <div className="form-group">
                        <label htmlFor="email">{t('signup.form.email')} *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t('signup.form.emailPlaceholder')}
                            className={`form-input ${errors.email ? 'error' : ''}`}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    {/* パスワード */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">{t('signup.form.password')} *</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={t('signup.form.passwordPlaceholder')}
                                className={`form-input ${errors.password ? 'error' : ''}`}
                            />
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">{t('signup.form.confirmPassword')} *</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder={t('signup.form.confirmPasswordPlaceholder')}
                                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                            />
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
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

                    {/* 業種・職種 */}
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

                    {/* 生年月日 */}
                    <div className="form-group">
                        <label htmlFor="birth_date">{t('signup.form.birthDate')} *</label>
                        <input
                            type="date"
                            id="birth_date"
                            name="birth_date"
                            value={formData.birth_date}
                            onChange={handleChange}
                            defaultValue="2020-01-01"
                            max={new Date().toISOString().split('T')[0]}
                            className={`form-input ${errors.birth_date ? 'error' : ''}`}
                        />
                        {errors.birth_date && <span className="error-message">{errors.birth_date}</span>}
                    </div>

                    {/* プラン選択 */}
                    <div className="form-group">
                        <label>{t('signup.form.plan')}</label>
                        <div className="plan-options">
                            <label className="plan-option">
                                <input
                                    type="radio"
                                    name="plan"
                                    value="free"
                                    checked={formData.plan === 'free'}
                                    onChange={handleChange}
                                />
                                <div className="plan-card">
                                    <h3>{t('signup.plans.free')}</h3>
                                    <p>{t('signup.plans.freeDescription')}</p>
                                    <div className="price">{t('signup.plans.freePrice')}</div>
                                </div>
                            </label>
                            <label className="plan-option">
                                <input
                                    type="radio"
                                    name="plan"
                                    value="premium"
                                    checked={formData.plan === 'premium'}
                                    onChange={handleChange}
                                />
                                <div className="plan-card">
                                    <h3>{t('signup.plans.premium')}</h3>
                                    <p>{t('signup.plans.premiumDescription')}</p>
                                    <div className="price">{t('signup.plans.premiumPrice')}</div>
                                </div>
                            </label>
                        </div>
                    </div>

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
                                <a href="/terms" target="_blank" rel="noopener noreferrer" className="terms-link">
                                    {t('signup.form.termsLink')}
                                </a>
                                {t('signup.form.and')}
                                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="terms-link">
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
                            t('signup.form.submit')
                        )}
                    </button>

                    <div className="signup-divider">
                        <span>{t('signup.form.or')}</span>
                    </div>

                    <button 
                        type="button" 
                        className={`btn btn-google google-signin-btn ${isLoading ? 'loading' : ''}`}
                        onClick={handleGoogleSignup}
                        disabled={isLoading}
                    >
                        <svg className="google-icon" width="20" height="20" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {t('signup.form.googleSignup')}
                    </button>
                </form>
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