import React, { useState } from 'react';
import axios from 'axios';

const RegistrationPage = () => {
    const [problemData, setProblemData] = useState({
        title: '',
        category: '',
        description: '',
        failure_reason: '',
        limitation: '',
        expected_outcome: '',
        // TODO: user_idは認証機能実装後に動的に取得する
        user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' 
    });

    const [techRequirements, setTechRequirements] = useState([]);
    const [showTechRequirements, setShowTechRequirements] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleProblemChange = (e) => {
        const { name, value } = e.target;
        setProblemData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleTechRequirementChange = (index, e) => {
        const { name, value } = e.target;
        const updatedRequirements = [...techRequirements];
        updatedRequirements[index] = { ...updatedRequirements[index], [name]: value };
        setTechRequirements(updatedRequirements);
    };

    const addTechRequirement = () => {
        setTechRequirements([...techRequirements, {
            title: '',
            description: '',
            technology_category: '',
            required_capabilities: '',
            info_scope: 'all_related'
        }]);
        setShowTechRequirements(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage('');
        
        try {
            // 1. 課題を登録
            const problemResponse = await axios.post('/api/problems/', problemData);
            const problem_id = problemResponse.data.problem_id;
            console.log('Problem created:', problemResponse.data);

            // 2. 技術要件（通知条件）を登録
            if (problem_id && techRequirements.length > 0) {
                for (const requirement of techRequirements) {
                    const requirementData = { ...requirement, problem_id };
                    const techResponse = await axios.post('/api/tech_requirements/', requirementData);
                    console.log('Tech Requirement created:', techResponse.data);
                }
            }
            
            setSuccessMessage('課題の登録が完了しました！最新技術とのマッチングを開始します。');
            
            // フォームをリセット
            setProblemData({
                title: '',
                category: '',
                description: '',
                failure_reason: '',
                limitation: '',
                expected_outcome: '',
                user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
            });
            setTechRequirements([]);
            setShowTechRequirements(false);

        } catch (error) {
            console.error('Error during registration:', error);
            alert('登録中にエラーが発生しました。しばらく待ってから再度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    const removeTechRequirement = (index) => {
        const updatedRequirements = techRequirements.filter((_, i) => i !== index);
        setTechRequirements(updatedRequirements);
        if (updatedRequirements.length === 0) {
            setShowTechRequirements(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">課題の登録</h1>
                <p className="page-subtitle">
                    過去に技術的制約で諦めた課題を詳細に登録し、最新AI技術での解決可能性を探しましょう
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
                        <h2 className="card-title">課題情報</h2>
                        <p className="card-subtitle">解決したい課題について詳しく教えてください</p>
                    </div>
                    <div className="card-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>課題タイトル *</label>
                                <input 
                                    type="text" 
                                    name="title" 
                                    value={problemData.title} 
                                    onChange={handleProblemChange} 
                                    placeholder="例: 高精度な音声認識システムの実現"
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>カテゴリ *</label>
                                <select name="category" value={problemData.category} onChange={handleProblemChange} required>
                                    <option value="">カテゴリを選択してください</option>
                                    <option value="AI/機械学習">AI/機械学習</option>
                                    <option value="自然言語処理">自然言語処理</option>
                                    <option value="音声処理">音声処理</option>
                                    <option value="画像処理">画像処理</option>
                                    <option value="ロボティクス">ロボティクス</option>
                                    <option value="その他">その他</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>課題の詳細説明 *</label>
                            <textarea 
                                name="description" 
                                value={problemData.description} 
                                onChange={handleProblemChange}
                                placeholder="どのような状況で発生している課題か、背景を含めて詳しく説明してください"
                                rows={4}
                                required 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>過去の失敗理由</label>
                            <textarea 
                                name="failure_reason" 
                                value={problemData.failure_reason} 
                                onChange={handleProblemChange}
                                placeholder="これまでに課題解決を試みたが、どのような理由で失敗したか教えてください"
                                rows={3}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>現在の制約条件</label>
                            <textarea 
                                name="limitation" 
                                value={problemData.limitation} 
                                onChange={handleProblemChange}
                                placeholder="予算、技術、時間などの制約条件があれば記入してください"
                                rows={3}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>期待する成果 *</label>
                            <textarea 
                                name="expected_outcome" 
                                value={problemData.expected_outcome} 
                                onChange={handleProblemChange}
                                placeholder="課題が解決された場合に得られるベネフィットを具体的に記入してください"
                                rows={3}
                                required 
                            />
                        </div>
                    </div>
                </div>

                <div className="card mb-6">
                    <div className="card-header">
                        <h2 className="card-title">技術要件・通知条件</h2>
                        <p className="card-subtitle">課題解決に必要な技術的要件を定義してください</p>
                    </div>
                    <div className="card-body">
                        {techRequirements.length === 0 ? (
                            <div className="text-center p-6">
                                <p className="text-secondary mb-4">技術要件が登録されていません</p>
                                <button type="button" onClick={addTechRequirement} className="btn btn-primary">
                                    最初の技術要件を追加
                                </button>
                            </div>
                        ) : (
                            <div>
                                {techRequirements.map((requirement, index) => (
                                    <div key={index} className="card mb-4" style={{ backgroundColor: 'var(--surface)' }}>
                                        <div className="card-body">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="card-title">技術要件 {index + 1}</h3>
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeTechRequirement(index)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
                                                >
                                                    削除
                                                </button>
                                            </div>
                                            
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>技術要件タイトル *</label>
                                                    <input 
                                                        type="text" 
                                                        name="title" 
                                                        value={requirement.title} 
                                                        onChange={(e) => handleTechRequirementChange(index, e)}
                                                        placeholder="例: 高精度な日本語音声認識AI"
                                                        required 
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>技術カテゴリ *</label>
                                                    <select name="technology_category" value={requirement.technology_category} onChange={(e) => handleTechRequirementChange(index, e)} required>
                                                        <option value="">カテゴリを選択</option>
                                                        <option value="大規模言語モデル">大規模言語モデル</option>
                                                        <option value="音声認識・TTS">音声認識・TTS</option>
                                                        <option value="コンピュータビジョン">コンピュータビジョン</option>
                                                        <option value="強化学習">強化学習</option>
                                                        <option value="生成AI">生成AI</option>
                                                        <option value="その他AI技術">その他AI技術</option>
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>技術要件の詳細 *</label>
                                                <textarea 
                                                    name="description" 
                                                    value={requirement.description} 
                                                    onChange={(e) => handleTechRequirementChange(index, e)}
                                                    placeholder="どのような技術的要件が必要か詳しく説明してください"
                                                    rows={3}
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>必要な技術的能力 *</label>
                                                <textarea 
                                                    name="required_capabilities" 
                                                    value={requirement.required_capabilities} 
                                                    onChange={(e) => handleTechRequirementChange(index, e)}
                                                    placeholder="精度、処理速度、コストなどの具体的な性能要件を記入してください"
                                                    rows={3}
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>情報収集の範囲</label>
                                                <select name="info_scope" value={requirement.info_scope} onChange={(e) => handleTechRequirementChange(index, e)}>
                                                    <option value="all_related">関連技術すべて（研究・サービス含む）</option>
                                                    <option value="all_related(service_only)">関連技術すべて（実用サービスのみ）</option>
                                                    <option value="problem_solving">課題解決に特化（研究・サービス含む）</option>
                                                    <option value="problem_solving(service_only)">課題解決に特化（実用サービスのみ）</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="text-center">
                                    <button type="button" onClick={addTechRequirement} className="btn btn-secondary">
                                        + さらに技術要件を追加
                                    </button>
                                </div>
                            </div>
                        )}
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
                            '課題を登録してマッチングを開始'
                        )}
                    </button>
                    <p className="text-secondary mt-4" style={{ fontSize: '0.875rem' }}>
                        登録後、最新のAI技術情報と自動マッチングし、解決可能性の高い技術が発見された際にメールで通知します。
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RegistrationPage;
