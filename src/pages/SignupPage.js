import React, { useState } from 'react';
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
                    plan: formData.plan
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
                </form>

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