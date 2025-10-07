import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const RequestPage = () => {
    const { t } = useTranslation(['pages', 'common']);
    const { user } = useAuth();
    const [requestData, setRequestData] = useState({
        request: '',
        request_type: 'search', // 'search' or 'site'
        search_obj: '',
        title: '',
        user_id: user?.user_id || ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [requests, setRequests] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);

    // 既存リクエスト一覧を取得
    const fetchRequests = async () => {
        try {
            setIsLoadingList(true);

            // URL監視リクエストと検索リクエストを並行取得
            const [urlResponse, searchResponse] = await Promise.all([
                axios.get('/api/url-requests/', {
                    params: { user_id: requestData.user_id }
                }),
                axios.get('/api/search-requests/', {
                    params: { user_id: requestData.user_id }
                })
            ]);

            // データを統合し、タイプを追加
            const urlRequests = (urlResponse.data.data || []).map(req => ({
                ...req,
                request_type: 'site',
                id: req.monitor_id,
                search_obj: req.url,
                is_active: req.status === 'active'
            }));

            const searchRequests = (searchResponse.data.data || []).map(req => ({
                ...req,
                request_type: 'search',
                id: req.search_id,
                search_obj: req.search_query,
                is_active: req.status === 'active'
            }));

            // 作成日時でソート（新しい順）
            const allRequests = [...urlRequests, ...searchRequests]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setRequests(allRequests);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setIsLoadingList(false);
        }
    };

    useEffect(() => {
        console.log('RequestPage useEffect - user:', user);
        console.log('RequestPage useEffect - user_id:', user?.user_id);

        if (user?.user_id) {
            setRequestData(prev => ({ ...prev, user_id: user.user_id }));
            fetchRequests();
        } else {
            console.warn('No user_id available, cannot fetch requests');
            setIsLoadingList(false);
        }
    }, [user?.user_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRequestData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage('');

        try {
            let response;

            if (editingRequest) {
                // 編集モード
                if (requestData.request_type === 'search') {
                    response = await axios.put('/api/search-requests/', {
                        search_id: editingRequest.id,
                        request: requestData.request,
                        search_query: requestData.search_obj,
                        title: requestData.title
                    });
                } else {
                    response = await axios.put('/api/url-requests/', {
                        monitor_id: editingRequest.id,
                        request: requestData.request,
                        url: requestData.search_obj,
                        title: requestData.title
                    });
                }
                setSuccessMessage('設定を更新しました');
            } else {
                // 新規作成モード
                if (requestData.request_type === 'search') {
                    response = await axios.post('/api/search-requests/', {
                        user_id: requestData.user_id,
                        request: requestData.request,
                        search_query: requestData.search_obj,
                        title: requestData.title
                    });
                } else {
                    response = await axios.post('/api/url-requests/', {
                        user_id: requestData.user_id,
                        request: requestData.request,
                        url: requestData.search_obj,
                        title: requestData.title
                    });
                }
                setSuccessMessage(t('register.success.message'));
            }

            console.log('Request saved:', response.data);

            // フォームをリセット
            setRequestData({
                request: '',
                request_type: 'search',
                search_obj: '',
                title: '',
                user_id: user?.user_id || ''
            });
            setShowForm(false);
            setEditingRequest(null);

            // リクエスト一覧を再取得
            fetchRequests();

        } catch (error) {
            console.error('Error during registration:', error);
            alert('保存中にエラーが発生しました。しばらく待ってから再度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    // リクエストの削除（編集フォームから呼び出される）
    const handleDeleteRequest = async () => {
        if (!editingRequest) return;

        if (!window.confirm('この設定を削除してもよろしいですか？')) {
            return;
        }

        try {
            if (editingRequest.request_type === 'search') {
                await axios.put('/api/search-requests/', {
                    search_id: editingRequest.id,
                    status: 'deleted'
                });
            } else {
                await axios.put('/api/url-requests/', {
                    monitor_id: editingRequest.id,
                    status: 'deleted'
                });
            }

            // フォームを閉じてリストを更新
            setShowForm(false);
            setEditingRequest(null);
            setRequestData({
                request: '',
                request_type: 'search',
                search_obj: '',
                title: '',
                user_id: user?.user_id || ''
            });
            fetchRequests();
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('削除中にエラーが発生しました。');
        }
    };

    // 編集ボタンをクリック
    const handleEditRequest = (request) => {
        setEditingRequest(request);
        setRequestData({
            request: request.request,
            request_type: request.request_type,
            search_obj: request.search_obj,
            title: request.title || '',
            user_id: user?.user_id || ''
        });
        setShowForm(true);
    };

    // 新規登録ボタンをクリック
    const handleNewRequest = () => {
        setEditingRequest(null);
        setRequestData({
            request: '',
            request_type: 'search',
            search_obj: '',
            title: '',
            user_id: user?.user_id || ''
        });
        setShowForm(true);
    };

    // キャンセルボタン
    const handleCancel = () => {
        setShowForm(false);
        setEditingRequest(null);
        setRequestData({
            request: '',
            request_type: 'search',
            search_obj: '',
            title: '',
            user_id: user?.user_id || ''
        });
    };

    // リストコンポーネント
    const RequestsList = () => {
        if (isLoadingList) {
            return (
                <div className="text-center py-8">
                    <div className="spinner mx-auto mb-4"></div>
                    <p>{t('register.list.loading')}</p>
                </div>
            );
        }

        if (requests.length === 0) {
            return (
                <div className="text-center py-8">
                    <p className="text-secondary">{t('register.list.empty')}</p>
                </div>
            );
        }

        return (
            <div className="requests-list">
                {requests.map((request) => (
                    <div key={request.id} className="request-item" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        border: '1px solid var(--border-color, #ddd)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--card-bg, white)'
                    }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                                {request.title || '無題の設定'}
                            </h4>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #666)' }}>
                                <span className="badge badge-outline">
                                    {t(`register.list.table.types.${request.request_type}`)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleEditRequest(request)}
                        >
                            編集
                        </button>
                    </div>
                ))}
            </div>
        );
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

            {/* 既存リクエスト一覧 */}
            <div className="card mb-6">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 className="card-title">{t('register.list.title')}</h2>
                        <p className="card-subtitle">{t('register.list.subtitle')}</p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleNewRequest}
                    >
                        ＋ 新規登録
                    </button>
                </div>
                <div className="card-body">
                    <RequestsList />
                </div>
            </div>

            {/* 編集/新規登録フォーム */}
            {showForm && (
                <form onSubmit={handleSubmit} className={isLoading ? 'loading' : ''}>
                <div className="card mb-6">
                    <div className="card-header">
                        <h2 className="card-title">
                            {editingRequest ? '設定を編集' : t('register.form.title')}
                        </h2>
                        <p className="card-subtitle">
                            {editingRequest ? '設定内容を変更して保存してください' : t('register.form.subtitle')}
                        </p>
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
                            <label>{t('register.form.titleLabel')}</label>
                            <input
                                type="text"
                                name="title"
                                value={requestData.title}
                                onChange={handleChange}
                                placeholder={t('register.form.placeholders.title')}
                            />
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
                    <button type="submit" className="btn btn-success" disabled={isLoading} style={{ marginRight: '0.5rem' }}>
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                {editingRequest ? '更新中...' : t('register.form.submitting')}
                            </>
                        ) : (
                            editingRequest ? '更新' : t('register.form.submit')
                        )}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isLoading} style={{ marginRight: '0.5rem' }}>
                        キャンセル
                    </button>
                    {editingRequest && (
                        <button type="button" className="btn btn-danger" onClick={handleDeleteRequest} disabled={isLoading}>
                            削除
                        </button>
                    )}
                    <p className="text-secondary mt-4" style={{ fontSize: '0.875rem' }}>
                        {t('register.footer.description')}
                    </p>
                </div>
            </form>
            )}
        </div>
    );
};

export default RequestPage;