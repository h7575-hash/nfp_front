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
        user_id: user?.user_id || ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [requests, setRequests] = useState([]);
    const [isLoadingList, setIsLoadingList] = useState(true);

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

            if (requestData.request_type === 'search') {
                // 検索リクエストの作成
                response = await axios.post('/api/search-requests/', {
                    user_id: requestData.user_id,
                    request: requestData.request,
                    search_query: requestData.search_obj
                });
            } else {
                // URL監視リクエストの作成
                response = await axios.post('/api/url-requests/', {
                    user_id: requestData.user_id,
                    request: requestData.request,
                    url: requestData.search_obj
                });
            }

            console.log('Request created:', response.data);
            setSuccessMessage(t('register.success.message'));

            // フォームをリセット（user_idは保持）
            setRequestData({
                request: '',
                request_type: 'search',
                search_obj: '',
                user_id: user?.user_id || ''
            });

            // リクエスト一覧を再取得
            fetchRequests();

        } catch (error) {
            console.error('Error during registration:', error);
            alert('登録中にエラーが発生しました。しばらく待ってから再度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    // リクエストの削除
    const handleDeleteRequest = async (request) => {
        if (!window.confirm('この設定を削除してもよろしいですか？')) {
            return;
        }

        try {
            if (request.request_type === 'search') {
                await axios.delete('/api/search-requests/', {
                    data: { search_id: request.id }
                });
            } else {
                await axios.delete('/api/url-requests/', {
                    data: { monitor_id: request.id }
                });
            }
            fetchRequests();
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('削除中にエラーが発生しました。');
        }
    };

    // リクエストの有効/無効切替
    const handleToggleRequest = async (request, currentStatus) => {
        try {
            const newStatus = currentStatus ? 'inactive' : 'active';

            if (request.request_type === 'search') {
                await axios.put('/api/search-requests/', {
                    search_id: request.id,
                    status: newStatus
                });
            } else {
                await axios.put('/api/url-requests/', {
                    monitor_id: request.id,
                    status: newStatus
                });
            }
            fetchRequests();
        } catch (error) {
            console.error('Error toggling request:', error);
            alert('ステータス変更中にエラーが発生しました。');
        }
    };

    // テーブルコンポーネント
    const RequestsTable = () => {
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
            <div className="table-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>{t('register.list.table.headers.type')}</th>
                            <th>{t('register.list.table.headers.target')}</th>
                            <th>{t('register.list.table.headers.content')}</th>
                            <th>{t('register.list.table.headers.status')}</th>
                            <th>{t('register.list.table.headers.createdAt')}</th>
                            <th>{t('register.list.table.headers.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request) => (
                            <tr key={request.id}>
                                <td>
                                    <span className="badge badge-outline">
                                        {t(`register.list.table.types.${request.request_type}`)}
                                    </span>
                                </td>
                                <td>
                                    <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                        {request.search_obj}
                                    </div>
                                </td>
                                <td>
                                    <div className="text-truncate" style={{ maxWidth: '250px' }}>
                                        {request.request}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${request.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                        {t(`register.list.table.status.${request.is_active ? 'active' : 'inactive'}`)}
                                    </span>
                                </td>
                                <td>
                                    {new Date(request.created_at).toLocaleDateString('ja-JP')}
                                </td>
                                <td>
                                    <div className="btn-group btn-group-sm">
                                        <button
                                            type="button"
                                            className={`btn ${request.is_active ? 'btn-warning' : 'btn-success'}`}
                                            onClick={() => handleToggleRequest(request, request.is_active)}
                                            title={t('register.list.table.actions.toggle')}
                                        >
                                            {request.is_active ? '停止' : '開始'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={() => handleDeleteRequest(request)}
                                            title={t('register.list.table.actions.delete')}
                                        >
                                            削除
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                <div className="card-header">
                    <h2 className="card-title">{t('register.list.title')}</h2>
                    <p className="card-subtitle">{t('register.list.subtitle')}</p>
                </div>
                <div className="card-body">
                    <RequestsTable />
                </div>
            </div>

            {/* 新規登録フォーム */}
            <form onSubmit={handleSubmit} className={isLoading ? 'loading' : ''}>
                <div className="card mb-6">
                    <div className="card-header">
                        <h2 className="card-title">{t('register.form.title')}</h2>
                        <p className="card-subtitle">{t('register.form.subtitle')}</p>
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