import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import PhoneVerificationForm from '../components/PhoneVerificationForm';
import './SettingsPage.css';

function SettingsPage() {
    const { t, i18n } = useTranslation(['pages', 'common']);
    const { user, updateUser, authenticatedFetch } = useAuth();
    const [settings, setSettings] = useState({
        notifications: {
            push: true,
            email: false
        },
        display: {
            language: i18n.language,
            theme: 'auto'
        },
        preferences: {
            emailFrequency: 'daily',
            timezone: 'Asia/Tokyo',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            aiAvatar: 'dog'
        }
    });
    
    const [profileData, setProfileData] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        company_name: '',
        purpose: '',
        industry: '',
        position: '',
        occupation: '',
        birth_date: ''
    });
    
    const [currentPlan, setCurrentPlan] = useState('free');
    const [showPlanForm, setShowPlanForm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [profileErrors, setProfileErrors] = useState({});
    
    // 決済管理関連のstate
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);
    const [isLoadingPayment, setIsLoadingPayment] = useState(false);
    
    // 電話番号管理関連のstate
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [showPhoneForm, setShowPhoneForm] = useState(false);
    const [isLoadingPhone, setIsLoadingPhone] = useState(false);
    const [phoneVerificationStep, setPhoneVerificationStep] = useState('input');
    const [phoneFormData, setPhoneFormData] = useState({ phone_number: '', verification_code: '' });
    const [phoneErrors, setPhoneErrors] = useState({});
    
    // コンポーネント初期化時にユーザー設定を取得
    useEffect(() => {
        loadUserSettings();
        if (user) {
            setPhoneNumber(user.phone_number || '');
            setPhoneVerified(user.phone_verified || false);
        }
    }, [user]);
    
    const loadUserSettings = async () => {
        try {
            const response = await fetch('/api/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: '1' }) // 実際の実装では認証システムから取得
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    // ユーザー設定を反映（安全に）
                    if (data.user.user_setting) {
                        const safeSettings = {
                            notifications: {
                                push: data.user.user_setting.notifications?.push ?? true,
                                email: data.user.user_setting.notifications?.email ?? false
                            },
                            display: {
                                language: data.user.user_setting.display?.language ?? i18n.language,
                                theme: data.user.user_setting.display?.theme ?? 'auto'
                            },
                            preferences: {
                                emailFrequency: data.user.user_setting.preferences?.emailFrequency ?? 'daily',
                                timezone: data.user.user_setting.preferences?.timezone ?? 'Asia/Tokyo',
                                dateFormat: data.user.user_setting.preferences?.dateFormat ?? 'YYYY-MM-DD',
                                timeFormat: data.user.user_setting.preferences?.timeFormat ?? '24h',
                                aiAvatar: data.user.user_setting.preferences?.aiAvatar ?? 'dog'
                            }
                        };
                        setSettings(safeSettings);
                        
                        // 言語設定があれば適用
                        if (safeSettings.display.language && safeSettings.display.language !== i18n.language) {
                            i18n.changeLanguage(safeSettings.display.language);
                        }
                    }
                    
                    // プロフィール情報を反映
                    setProfileData({
                        email: data.user.email || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                        company_name: data.user.company_name || '',
                        purpose: data.user.purpose || '',
                        industry: data.user.industry || '',
                        position: data.user.position || '',
                        occupation: data.user.occupation || '',
                        birth_date: data.user.birth_date || ''
                    });
                    
                    // プラン情報を反映
                    setCurrentPlan(data.user.plan || 'free');
                    
                    // サブスクリプション情報を取得
                    if (data.user.plan !== 'free') {
                        loadSubscriptionInfo();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
        }
    };
    
    // サブスクリプション情報を取得
    const loadSubscriptionInfo = async () => {
        try {
            const response = await fetch('/api/payments/subscription-info', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSubscriptionInfo(data.subscription);
                } else {
                    console.error('Failed to load subscription info:', data.error);
                    // Stripeエラーの場合は特別なメッセージを表示
                    if (data.stripe_error) {
                        setSubscriptionInfo({ error: 'Stripe接続エラーのため、決済情報を表示できません。' });
                    }
                }
            }
        } catch (error) {
            console.error('Error loading subscription info:', error);
            setSubscriptionInfo({ error: 'ネットワークエラーのため、決済情報を表示できません。' });
        }
    };
    
    // カスタマーポータルを開く
    const handleOpenCustomerPortal = async () => {
        setIsLoadingPayment(true);
        try {
            const response = await fetch('/api/payments/customer-portal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    return_url: window.location.origin + '/settings'
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.url) {
                // カスタマーポータルに遷移
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to open customer portal');
            }
        } catch (error) {
            console.error('Error opening customer portal:', error);
            alert(`カスタマーポータルを開けませんでした: ${error.message}`);
        } finally {
            setIsLoadingPayment(false);
        }
    };

    const handleSettingChange = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...(prev[category] || {}),
                [key]: value
            }
        }));
        
        // 言語変更の場合はi18nも更新
        if (category === 'display' && key === 'language') {
            i18n.changeLanguage(value);
        }
    };

    const handleSave = () => {
        // 設定保存処理
        console.log('Settings saved:', settings);
        alert(t('common:messages.settingsSaved'));
    };
    
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
        // エラーをクリア
        if (profileErrors[name]) {
            setProfileErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };
    
    const validateProfile = () => {
        const newErrors = {};
        
        if (!profileData.email) newErrors.email = t('signup.validation.emailRequired');
        if (profileData.newPassword && profileData.newPassword.length < 8) {
            newErrors.newPassword = t('signup.validation.passwordMinLength');
        }
        if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
            newErrors.confirmPassword = t('signup.validation.passwordMismatch');
        }
        if (!profileData.currentPassword) {
            newErrors.currentPassword = '現在のパスワードは必須です';
        }
        if (!profileData.purpose) newErrors.purpose = t('signup.validation.purposeRequired');
        if (!profileData.industry) newErrors.industry = t('signup.validation.industryRequired');
        if (!profileData.occupation) newErrors.occupation = t('signup.validation.occupationRequired');
        if (!profileData.birth_date) newErrors.birth_date = t('signup.validation.birthDateRequired');
        
        setProfileErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handlePlanChange = (newPlan) => {
        console.log('Plan change from', currentPlan, 'to', newPlan);
        setCurrentPlan(newPlan);
        alert(`プランを${newPlan === 'free' ? '無料プラン' : '有料プラン'}に変更しました`);
        setShowPlanForm(false);
    };
    
    const handleAccountDelete = async (e) => {
        e.preventDefault();
        
        if (!deletePassword) {
            alert('パスワードを入力してください');
            return;
        }
        
        const confirmDelete = window.confirm(`
本当にアカウントを削除しますか？

この操作は取り消しできません。
アカウントのすべてのデータが削除されます。`);
        
        if (!confirmDelete) {
            return;
        }
        
        try {
            const response = await fetch('/api/users', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: '1', // 実際の実装では認証されたユーザーIDを使用
                    password: deletePassword
                })
            });
            
            const result = await response.json();
            console.log('Delete response:', result);
            
            if (response.ok && result.success) {
                alert('アカウントが削除されました。');
                // ログアウト処理やホームページへのリダイレクトなど
                window.location.href = '/';
            } else {
                throw new Error(result.error || `Delete failed (Status: ${response.status})`);
            }
            
        } catch (error) {
            console.error('削除エラー:', error);
            alert(`アカウント削除に失敗しました: ${error.message}`);
        }
    };

    // PhoneVerificationForm成功時のハンドラー
    const handlePhoneVerificationSuccess = (result) => {
        setPhoneNumber(result.phone_number);
        setPhoneVerified(true);
        setShowPhoneForm(false);
        
        // ユーザー情報を更新
        const updatedUser = {
            ...user,
            phone_number: result.phone_number,
            phone_verified: true
        };
        updateUser(updatedUser);
        
        alert('電話番号が正常に認証されました');
    };

    // PhoneVerificationFormエラー時のハンドラー
    const handlePhoneVerificationError = (error) => {
        console.error('Phone verification error:', error);
        alert('電話番号認証でエラーが発生しました: ' + error.message);
    };

    // 電話番号を削除
    const removePhoneNumber = async () => {
        if (!window.confirm('電話番号を削除しますか？')) {
            return;
        }

        setIsLoadingPhone(true);

        try {
            const response = await authenticatedFetch('/api/auth/remove-phone', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: user.user_id
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setPhoneNumber('');
                setPhoneVerified(false);
                
                // ユーザー情報を更新
                const updatedUser = {
                    ...user,
                    phone_number: null,
                    phone_verified: false
                };
                updateUser(updatedUser);
                
                alert('電話番号を削除しました');
            } else {
                alert(result.error || '電話番号の削除に失敗しました');
            }
        } catch (error) {
            console.error('Phone remove error:', error);
            alert('ネットワークエラーが発生しました');
        } finally {
            setIsLoadingPhone(false);
        }
    };

    // 電話番号編集をキャンセル
    const cancelPhoneEdit = () => {
        setShowPhoneForm(false);
        setPhoneVerificationStep('input');
        setPhoneFormData({ phone_number: '', verification_code: '' });
        setPhoneErrors({});
    };
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        if (!validateProfile()) {
            return;
        }
        
        try {
            // APIリクエスト用のデータを準備
            const updateData = {
                user_id: '1', // 実際の実装では認証されたユーザーIDを使用
                email: profileData.email,
                purpose: profileData.purpose,
                industry: profileData.industry,
                occupation: profileData.occupation,
                birth_date: profileData.birth_date,
                current_password: profileData.currentPassword // 常に必須
            };
            
            // パスワード変更がある場合のみ追加
            if (profileData.newPassword) {
                updateData.new_password = profileData.newPassword;
            }
            
            // プロキシ経由でAPIリクエスト送信
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });
            
            const result = await response.json();
            console.log('Update response:', result);
            
            if (response.ok && result.success) {
                alert('登録情報が更新されました');
                setShowProfileForm(false);
                // パスワードフィールドをクリア
                setProfileData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            } else {
                throw new Error(result.error || `Update failed (Status: ${response.status})`);
            }
            
        } catch (error) {
            console.error('更新エラー:', error);
            alert(`更新に失敗しました: ${error.message}`);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{t('pages:settings.title')}</h1>
                <p className="page-subtitle">{t('pages:settings.subtitle')}</p>
            </div>

            <div className="settings-container">
                <div className="settings-section">
                    <h2 className="settings-section-title">{t('pages:settings.sections.notifications')}</h2>
                    <div className="settings-item">
                        <label className="settings-label">
                            <span>{t('pages:settings.notifications.push')}</span>
                            <input
                                type="checkbox"
                                checked={settings.notifications?.push ?? false}
                                onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                                className="settings-checkbox"
                            />
                        </label>
                    </div>
                    <div className="settings-item">
                        <label className="settings-label">
                            <span>{t('pages:settings.notifications.email')}</span>
                            <input
                                type="checkbox"
                                checked={settings.notifications?.email ?? false}
                                onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                                className="settings-checkbox"
                            />
                        </label>
                    </div>
                </div>

                <div className="settings-section">
                    <h2 className="settings-section-title">{t('pages:settings.sections.display')}</h2>
                    <div className="settings-item">
                        <label className="settings-label">
                            <span>{t('pages:settings.display.language')}</span>
                            <select
                                value={settings.display?.language ?? 'ja'}
                                onChange={(e) => handleSettingChange('display', 'language', e.target.value)}
                                className="settings-select"
                            >
                                <option value="ja">{t('pages:settings.display.languages.ja')}</option>
                                <option value="en">{t('pages:settings.display.languages.en')}</option>
                            </select>
                        </label>
                    </div>
                    <div className="settings-item">
                        <label className="settings-label">
                            <span>{t('pages:settings.preferences.aiAvatar')}</span>
                            <select
                                value={settings.preferences?.aiAvatar ?? 'dog'}
                                onChange={(e) => handleSettingChange('preferences', 'aiAvatar', e.target.value)}
                                className="settings-select"
                            >
                                <option value="dog">{t('pages:settings.preferences.avatars.dog')}</option>
                                <option value="cat">{t('pages:settings.preferences.avatars.cat')}</option>
                                <option value="goat">{t('pages:settings.preferences.avatars.goat')}</option>
                            </select>
                        </label>
                    </div>
                </div>

                <div className="settings-section">
                    <h2 className="settings-section-title">{t('pages:settings.sections.profile')}</h2>
                    
                    {!showProfileForm ? (
                        <div className="settings-item">
                            <button 
                                className="settings-button secondary"
                                onClick={() => setShowProfileForm(true)}
                            >
                                {t('pages:settings.profile.updateProfile')}
                            </button>
                        </div>
                    ) : (
                        <div className="profile-form-container">
                            <form onSubmit={handleProfileUpdate} className="profile-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email">メールアドレス *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={profileData.email}
                                            onChange={handleProfileChange}
                                            className={`form-input ${profileErrors.email ? 'error' : ''}`}
                                        />
                                        {profileErrors.email && <span className="error-message">{profileErrors.email}</span>}
                                    </div>
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="newPassword">新しいパスワード</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={profileData.newPassword}
                                            onChange={handleProfileChange}
                                            placeholder="変更する場合入力"
                                            className={`form-input ${profileErrors.newPassword ? 'error' : ''}`}
                                        />
                                        {profileErrors.newPassword && <span className="error-message">{profileErrors.newPassword}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">パスワード確認</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={profileData.confirmPassword}
                                            onChange={handleProfileChange}
                                            placeholder="新しいパスワードを再入力"
                                            className={`form-input ${profileErrors.confirmPassword ? 'error' : ''}`}
                                        />
                                        {profileErrors.confirmPassword && <span className="error-message">{profileErrors.confirmPassword}</span>}
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="purpose">利用目的 *</label>
                                    <select
                                        id="purpose"
                                        name="purpose"
                                        value={profileData.purpose}
                                        onChange={handleProfileChange}
                                        className={`form-input ${profileErrors.purpose ? 'error' : ''}`}
                                    >
                                        <option value="">選択してください</option>
                                        <option value="private">プライベート</option>
                                        <option value="business">ビジネス</option>
                                        <option value="both">両方</option>
                                    </select>
                                    {profileErrors.purpose && <span className="error-message">{profileErrors.purpose}</span>}
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="industry">業種 *</label>
                                        <select
                                            id="industry"
                                            name="industry"
                                            value={profileData.industry}
                                            onChange={handleProfileChange}
                                            className={`form-input ${profileErrors.industry ? 'error' : ''}`}
                                        >
                                            <option value="">選択してください</option>
                                            <option value="tech">IT・テクノロジー</option>
                                            <option value="finance">金融・保険</option>
                                            <option value="manufacturing">製造業</option>
                                            <option value="healthcare">医療・ヘルスケア</option>
                                            <option value="retail">小売・EC</option>
                                            <option value="education">教育</option>
                                            <option value="consulting">コンサルティング</option>
                                            <option value="media">メディア・広告</option>
                                            <option value="logistics">物流・運輸</option>
                                            <option value="construction">建設・不動産</option>
                                            <option value="government">公共・行政</option>
                                            <option value="other">その他</option>
                                        </select>
                                        {profileErrors.industry && <span className="error-message">{profileErrors.industry}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="occupation">職種 *</label>
                                        <select
                                            id="occupation"
                                            name="occupation"
                                            value={profileData.occupation}
                                            onChange={handleProfileChange}
                                            className={`form-input ${profileErrors.occupation ? 'error' : ''}`}
                                        >
                                            <option value="">選択してください</option>
                                            <option value="engineer">エンジニア</option>
                                            <option value="designer">デザイナー</option>
                                            <option value="manager">マネージャー</option>
                                            <option value="consultant">コンサルタント</option>
                                            <option value="researcher">研究者</option>
                                            <option value="sales">営業</option>
                                            <option value="marketing">マーケティング</option>
                                            <option value="hr">人事</option>
                                            <option value="finance">財務・経理</option>
                                            <option value="student">学生</option>
                                            <option value="freelancer">フリーランス</option>
                                            <option value="other">その他</option>
                                        </select>
                                        {profileErrors.occupation && <span className="error-message">{profileErrors.occupation}</span>}
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="birth_date">生年月日 *</label>
                                    <input
                                        type="date"
                                        id="birth_date"
                                        name="birth_date"
                                        value={profileData.birth_date}
                                        onChange={handleProfileChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`form-input ${profileErrors.birth_date ? 'error' : ''}`}
                                    />
                                    {profileErrors.birth_date && <span className="error-message">{profileErrors.birth_date}</span>}
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="currentPassword">現在のパスワード <span style={{color: '#dc2626'}}>*</span></label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={profileData.currentPassword}
                                        onChange={handleProfileChange}
                                        placeholder="確認のため入力してください"
                                        className={`form-input ${profileErrors.currentPassword ? 'error' : ''}`}
                                        required
                                    />
                                    {profileErrors.currentPassword && <span className="error-message">{profileErrors.currentPassword}</span>}
                                </div>
                                
                                <div className="form-actions">
                                    <button type="submit" className="settings-button primary">
                                        更新する
                                    </button>
                                    <button 
                                        type="button" 
                                        className="settings-button secondary"
                                        onClick={() => setShowProfileForm(false)}
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* 電話番号管理セクション */}
                <div className="settings-section">
                    <h2 className="settings-section-title">電話番号管理</h2>
                    
                    {!showPhoneForm ? (
                        <div className="phone-info">
                            {phoneNumber ? (
                                <div className="current-phone-info">
                                    <div className="phone-status">
                                        <span className="phone-number">{phoneNumber}</span>
                                        <span className={`verification-badge ${phoneVerified ? 'verified' : 'unverified'}`}>
                                            {phoneVerified ? '✓ 認証済み' : '未認証'}
                                        </span>
                                    </div>
                                    <div className="phone-actions">
                                        <button 
                                            className="settings-button secondary"
                                            onClick={() => setShowPhoneForm(true)}
                                        >
                                            電話番号を変更
                                        </button>
                                        <button 
                                            className="settings-button danger"
                                            onClick={removePhoneNumber}
                                            disabled={isLoadingPhone}
                                        >
                                            {isLoadingPhone ? '削除中...' : '電話番号を削除'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="no-phone-info">
                                    <p>電話番号が登録されていません</p>
                                    <button 
                                        className="settings-button primary"
                                        onClick={() => setShowPhoneForm(true)}
                                    >
                                        電話番号を追加
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="phone-form">
                            <PhoneVerificationForm
                                userData={{ user_id: user.user_id }}
                                onSuccess={handlePhoneVerificationSuccess}
                                onError={handlePhoneVerificationError}
                            />
                            <div className="form-actions" style={{ marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={cancelPhoneEdit}
                                    className="settings-button secondary"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="settings-section">
                    <h2 className="settings-section-title">プラン変更</h2>
                    
                    {!showPlanForm ? (
                        <div>
                            <div className="current-plan-info">
                                <p>現在のプラン: <strong>{currentPlan === 'free' ? '無料プラン' : '有料プラン'}</strong></p>
                            </div>
                            <div className="settings-item">
                                <button 
                                    className="settings-button secondary"
                                    onClick={() => setShowPlanForm(true)}
                                >
                                    プランを変更する
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="plan-form-container">
                            <div className="plan-selection">
                                <h3>プランを選択してください</h3>
                                <div className="plan-options">
                                    <label className="plan-option">
                                        <input
                                            type="radio"
                                            name="newPlan"
                                            value="free"
                                            checked={false}
                                            onChange={() => handlePlanChange('free')}
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
                                            name="newPlan"
                                            value="premium"
                                            checked={false}
                                            onChange={() => handlePlanChange('premium')}
                                        />
                                        <div className="plan-card">
                                            <h3>有料プラン</h3>
                                            <p>高度な分析機能と優先通知をご利用いただけます</p>
                                            <div className="price">¥980/月</div>
                                        </div>
                                    </label>
                                </div>
                                <div className="form-actions">
                                    <button 
                                        type="button" 
                                        className="settings-button secondary"
                                        onClick={() => setShowPlanForm(false)}
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 決済管理セクション */}
                <div className="settings-section">
                    <h2 className="settings-section-title">決済・請求書管理</h2>
                    
                    {currentPlan === 'free' ? (
                        <div className="billing-info">
                            <div className="billing-status">
                                <div className="status-item">
                                    <span className="status-label">現在のプラン:</span>
                                    <span className="status-value free-plan">無料プラン</span>
                                </div>
                                <p className="status-description">
                                    無料プランをご利用中です。有料プランにアップグレードすると、より多くの機能をご利用いただけます。
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="billing-info">
                            <div className="billing-status">
                                <div className="status-item">
                                    <span className="status-label">現在のプラン:</span>
                                    <span className={`status-value ${currentPlan}-plan`}>
                                        {currentPlan === 'plus' ? 'Plusプラン' : 'Unlimitedプラン'}
                                    </span>
                                </div>
                                {subscriptionInfo && subscriptionInfo.error ? (
                                    <div className="billing-error">
                                        <span className="error-icon">⚠️</span>
                                        <span className="error-message">{subscriptionInfo.error}</span>
                                    </div>
                                ) : subscriptionInfo && (
                                    <>
                                        <div className="status-item">
                                            <span className="status-label">次回請求日:</span>
                                            <span className="status-value">
                                                {new Date(subscriptionInfo.next_billing_date).toLocaleDateString('ja-JP')}
                                            </span>
                                        </div>
                                        <div className="status-item">
                                            <span className="status-label">請求金額:</span>
                                            <span className="status-value">
                                                ¥{subscriptionInfo.amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="status-item">
                                            <span className="status-label">ステータス:</span>
                                            <span className={`status-value status-${subscriptionInfo.status}`}>
                                                {subscriptionInfo.status === 'active' ? '有効' :
                                                 subscriptionInfo.status === 'canceled' ? 'キャンセル済み' :
                                                 subscriptionInfo.status === 'past_due' ? '支払い遅延' : subscriptionInfo.status}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="billing-actions">
                                <button 
                                    className="settings-button primary"
                                    onClick={handleOpenCustomerPortal}
                                    disabled={isLoadingPayment}
                                >
                                    {isLoadingPayment ? (
                                        <>
                                            <span className="spinner"></span>
                                            読み込み中...
                                        </>
                                    ) : (
                                        '請求書・支払い管理'
                                    )}
                                </button>
                                <div className="billing-help">
                                    <p>カスタマーポータルでは以下の操作が可能です：</p>
                                    <ul>
                                        <li>請求書の確認・ダウンロード</li>
                                        <li>支払い方法の変更</li>
                                        <li>プランの変更・キャンセル</li>
                                        <li>請求履歴の確認</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="settings-section">
                    <h2 className="settings-section-title">{t('pages:settings.sections.deleteAccount')}</h2>
                    
                    {!showDeleteConfirm ? (
                        <div className="settings-item">
                            <button 
                                className="settings-button danger"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                {t('pages:settings.deleteAccount.deleteAccount')}
                            </button>
                        </div>
                    ) : (
                        <div className="delete-form-container">
                            <div className="delete-warning">
                                <h3>⚠️ アカウント削除の確認</h3>
                                <p>アカウントを削除すると、以下のデータが失われます：</p>
                                <ul>
                                    <li>登録した個人情報</li>
                                    <li>登録した課題データ</li>
                                    <li>通知設定や履歴</li>
                                </ul>
                                <p className="warning-text">この操作は元に戻すことができません。</p>
                            </div>
                            
                            <form onSubmit={handleAccountDelete} className="delete-form">
                                <div className="form-group">
                                    <label htmlFor="deletePassword">パスワードで確認 *</label>
                                    <input
                                        type="password"
                                        id="deletePassword"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder="現在のパスワードを入力してください"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                
                                <div className="form-actions">
                                    <button type="submit" className="settings-button danger">
                                        アカウントを削除する
                                    </button>
                                    <button 
                                        type="button" 
                                        className="settings-button secondary"
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeletePassword('');
                                        }}
                                    >
                                        キャンセル
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                <div className="settings-actions">
                    <button onClick={handleSave} className="settings-button primary">
                        {t('pages:settings.actions.saveSettings')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;