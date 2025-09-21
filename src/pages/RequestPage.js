import React, { useState } from 'react';
import axios from 'axios';

const RequestPage = () => {
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
            
            setSuccessMessage('リクエストの登録が完了しました！条件に合致する情報が見つかり次第、通知いたします。');
            
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
                <h1 className="page-title">情報監視リクエストの登録</h1>
                <p className="page-subtitle">
                    特定の情報やニュースを監視し、条件に合致した場合に通知を受け取れます
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
                        <h2 className="card-title">監視設定</h2>
                        <p className="card-subtitle">どのような情報を監視するかを設定してください</p>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label>監視タイプ *</label>
                            <select 
                                name="request_type" 
                                value={requestData.request_type} 
                                onChange={handleChange}
                                required
                            >
                                <option value="search">検索監視（キーワードベース）</option>
                                <option value="site">特定サイト監視</option>
                            </select>
                            <div className="form-help-text">
                                <p><strong>検索監視：</strong>Tavilyを使って特定のキーワードで定期的に検索し、新しい情報を監視</p>
                                <p><strong>特定サイト監視：</strong>指定したWebサイトの更新を監視</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                {requestData.request_type === 'search' ? '検索クエリ *' : '監視サイトURL *'}
                            </label>
                            <input 
                                type={requestData.request_type === 'site' ? 'url' : 'text'}
                                name="search_obj" 
                                value={requestData.search_obj} 
                                onChange={handleChange}
                                placeholder={
                                    requestData.request_type === 'search' 
                                        ? '例: ChatGPT 新機能 2024' 
                                        : '例: https://openai.com/blog'
                                }
                                required 
                            />
                            <div className="form-help-text">
                                {requestData.request_type === 'search' ? (
                                    <p>監視したいキーワードやトピックを入力してください。複数のキーワードはスペースで区切ってください。</p>
                                ) : (
                                    <p>監視したいWebサイトのURLを入力してください。そのサイトの更新を定期的にチェックします。</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>通知条件 *</label>
                            <textarea 
                                name="request" 
                                value={requestData.request} 
                                onChange={handleChange}
                                placeholder="例: ChatGPTの新しいプラグインや機能が発表された場合に通知してください。特にAPI関連の更新に興味があります。"
                                rows={6}
                                required 
                                style={{ minHeight: '150px' }}
                            />
                            <div className="form-help-text">
                                <p>どのような条件で通知を受け取りたいかを詳しく記入してください：</p>
                                <ul>
                                    <li>特に注目したいキーワードや内容</li>
                                    <li>除外したい情報（ノイズを減らすため）</li>
                                    <li>通知の優先度や緊急度</li>
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
                                登録中...
                            </>
                        ) : (
                            '監視リクエストを登録する'
                        )}
                    </button>
                    <p className="text-secondary mt-4" style={{ fontSize: '0.875rem' }}>
                        登録後、AIが定期的に情報をチェックし、条件に合致する情報が見つかった場合にメールで通知します。
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RequestPage;