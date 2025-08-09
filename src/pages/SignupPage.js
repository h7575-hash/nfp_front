import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        purpose: '',
        industry: '',
        occupation: '',
        age: '',
        plan: 'free'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // 選択肢データ
    const purposeOptions = [
        { value: 'private', label: 'プライベート' },
        { value: 'business', label: 'ビジネス' },
        { value: 'both', label: '両方' }
    ];

    const industryOptions = [
        { value: 'tech', label: 'IT・テクノロジー' },
        { value: 'finance', label: '金融・保険' },
        { value: 'manufacturing', label: '製造業' },
        { value: 'healthcare', label: '医療・ヘルスケア' },
        { value: 'retail', label: '小売・EC' },
        { value: 'education', label: '教育' },
        { value: 'consulting', label: 'コンサルティング' },
        { value: 'media', label: 'メディア・広告' },
        { value: 'logistics', label: '物流・運輸' },
        { value: 'construction', label: '建設・不動産' },
        { value: 'government', label: '公共・行政' },
        { value: 'other', label: 'その他' }
    ];

    const occupationOptions = [
        { value: 'engineer', label: 'エンジニア' },
        { value: 'designer', label: 'デザイナー' },
        { value: 'manager', label: 'マネージャー' },
        { value: 'consultant', label: 'コンサルタント' },
        { value: 'researcher', label: '研究者' },
        { value: 'sales', label: '営業' },
        { value: 'marketing', label: 'マーケティング' },
        { value: 'hr', label: '人事' },
        { value: 'finance', label: '財務・経理' },
        { value: 'student', label: '学生' },
        { value: 'freelancer', label: 'フリーランス' },
        { value: 'executive', label: '経営者' },
        { value: 'other', label: 'その他' }
    ];

    const ageOptions = [
        { value: '18-24', label: '18-24歳' },
        { value: '25-29', label: '25-29歳' },
        { value: '30-34', label: '30-34歳' },
        { value: '35-39', label: '35-39歳' },
        { value: '40-49', label: '40-49歳' },
        { value: '50-59', label: '50-59歳' },
        { value: '60+', label: '60歳以上' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
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

    const validateForm = () => {
        const newErrors = {};

        // 必須項目チェック
        if (!formData.email) newErrors.email = 'メールアドレスは必須です';
        if (!formData.password) newErrors.password = 'パスワードは必須です';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'パスワード確認は必須です';
        if (!formData.purpose) newErrors.purpose = '利用目的を選択してください';
        if (!formData.industry) newErrors.industry = '業種を選択してください';
        if (!formData.occupation) newErrors.occupation = '職種を選択してください';
        if (!formData.age) newErrors.age = '年齢を選択してください';

        // パスワード一致チェック
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'パスワードが一致しません';
        }

        // パスワード長チェック
        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'パスワードは8文字以上で入力してください';
        }

        // メールフォーマットチェック
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = '有効なメールアドレスを入力してください';
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
            // API呼び出し処理
            await new Promise(resolve => setTimeout(resolve, 1500)); // 仮の待機
            // 成功時の処理（リダイレクトなど）
            alert('登録が完了しました！');
        } catch (error) {
            console.error('登録エラー:', error);
            alert('登録に失敗しました。もう一度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <div className="signup-header">
                    <h1>新規登録</h1>
                    <p>News dogアカウントを作成して、最新の技術情報を受け取りましょう</p>
                </div>

                <form onSubmit={handleSubmit} className="signup-form">
                    {/* メールアドレス */}
                    <div className="form-group">
                        <label htmlFor="email">メールアドレス *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className={`form-input ${errors.email ? 'error' : ''}`}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    {/* パスワード */}
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">パスワード *</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="8文字以上"
                                className={`form-input ${errors.password ? 'error' : ''}`}
                            />
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">パスワード確認 *</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="パスワードを再入力"
                                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                            />
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    {/* 利用目的 */}
                    <div className="form-group">
                        <label htmlFor="purpose">利用目的 *</label>
                        <select
                            id="purpose"
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            className={`form-input ${errors.purpose ? 'error' : ''}`}
                        >
                            <option value="">選択してください</option>
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
                            <label htmlFor="industry">業種 *</label>
                            <select
                                id="industry"
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                className={`form-input ${errors.industry ? 'error' : ''}`}
                            >
                                <option value="">選択してください</option>
                                {industryOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.industry && <span className="error-message">{errors.industry}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="occupation">職種 *</label>
                            <select
                                id="occupation"
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                                className={`form-input ${errors.occupation ? 'error' : ''}`}
                            >
                                <option value="">選択してください</option>
                                {occupationOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.occupation && <span className="error-message">{errors.occupation}</span>}
                        </div>
                    </div>

                    {/* 年齢 */}
                    <div className="form-group">
                        <label htmlFor="age">年齢 *</label>
                        <select
                            id="age"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className={`form-input ${errors.age ? 'error' : ''}`}
                        >
                            <option value="">選択してください</option>
                            {ageOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.age && <span className="error-message">{errors.age}</span>}
                    </div>

                    {/* プラン選択 */}
                    <div className="form-group">
                        <label>プラン選択</label>
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
                                    <h3>無料プラン</h3>
                                    <p>基本的な通知機能をご利用いただけます</p>
                                    <div className="price">¥0/月</div>
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
                                    <h3>有料プラン</h3>
                                    <p>高度な分析機能と優先通知をご利用いただけます</p>
                                    <div className="price">¥980/月</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={`btn btn-primary signup-btn ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                登録中...
                            </>
                        ) : (
                            'アカウントを作成'
                        )}
                    </button>
                </form>

                <div className="signup-footer">
                    <p>
                        すでにアカウントをお持ちですか？ 
                        <Link to="/login" className="login-link">
                            ログイン
                        </Link>
                    </p>
                    <p className="terms-text">
                        登録することで、
                        <Link to="/terms" className="terms-link">利用規約</Link>
                        および
                        <Link to="/privacy" className="terms-link">プライバシーポリシー</Link>
                        に同意したものとします。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;