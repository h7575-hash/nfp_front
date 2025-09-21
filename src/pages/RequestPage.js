import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const RequestPage = () => {
    const { t } = useTranslation(['pages', 'common']);
    const [requestData, setRequestData] = useState({
        request: '',
        request_type: 'search', // 'search' or 'site'
        search_obj: '',
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // TODO: 認証機能実装後に動的に取得する
    });

    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRequestData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage('');
        
        try {
            const response = await axios.post('/api/requests/', requestData);
            console.log('Request created:', response.data);
            
            setSuccessMessage(t('register.success.message'));
            
            // フォームをリセット
            setRequestData({
                request: '',
                request_type: 'search',
                search_obj: '',
                user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            });

        } catch (error) {
            console.error('Error during registration:', error);
            alert('登録中にエラーが発生しました。しばらく待ってから再度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{t('register.title')}</h1>
                <p className="page-subtitle">
                    {t('register.subtitle')}
                </p>
            </div>

            {successMessage && (
                <div className="card mb-6" style={{ backgroundColor: 'var(--success)', color: 'white', border: 'none' }}>
                    <div className="card-body text-center">
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>✓ 登録完了</h3>
                        <p style={{ margin: 0, color: 'white' }}>{successMessage}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className={isLoading ? 'loading' : ''}>
                <div className="card mb-6">
                    <div className="card-header">
                        <h2 className="card-title">チェック設定</h2>
                        <p className="card-subtitle">どのような情報をチェックするかを設定してください</p>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label>{t('register.form.checkMethod')} *</label>
                            <select 
                                name="request_type" 
                                value={requestData.request_type} 
                                onChange={handleChange}
                                required
                            >
                                <option value="search">{t('register.form.options.search')}</option>
                                <option value="site">{t('register.form.options.site')}</option>
                            </select>
                            <div className="form-help-text">
                                <p><strong>{t('register.form.options.search')}：</strong>{t('register.form.helpText.searchMethod')}</p>
                                <p><strong>{t('register.form.options.site')}：</strong>{t('register.form.helpText.siteMethod')}</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                {requestData.request_type === 'search' ? t('register.form.searchKeyword') + ' *' : t('register.form.siteUrl') + ' *'}
                            </label>
                            <input 
                                type={requestData.request_type === 'site' ? 'url' : 'text'}
                                name="search_obj" 
                                value={requestData.search_obj} 
                                onChange={handleChange}
                                placeholder={
                                    requestData.request_type === 'search' 
                                        ? t('register.form.placeholders.searchKeyword') 
                                        : t('register.form.placeholders.siteUrl')
                                }
                                required 
                            />
                            <div className="form-help-text">
                                {requestData.request_type === 'search' ? (
                                    <p>{t('register.form.helpText.searchInput')}</p>
                                ) : (
                                    <p>{t('register.form.helpText.siteInput')}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>{t('register.form.notificationContent')} *</label>
                            <textarea 
                                name="request" 
                                value={requestData.request} 
                                onChange={handleChange}
                                placeholder={t('register.form.placeholders.notificationContent')}
                                rows={6}
                                required 
                                style={{ minHeight: '150px' }}
                            />
                            <div className="form-help-text">
                                <p>{t('register.form.helpText.notificationDetails')}</p>
                                <ul>
                                    <li>{t('register.form.guidelines.keywords')}</li>
                                    <li>{t('register.form.guidelines.exclude')}</li>
                                    <li>{t('register.form.guidelines.urgency')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button type="submit" className="btn btn-success" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                {t('register.form.submitting')}
                            </>
                        ) : (
                            t('register.form.submit')
                        )}
                    </button>
                    <p className="text-secondary mt-4" style={{ fontSize: '0.875rem' }}>
                        {t('register.footer.description')}
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RequestPage;