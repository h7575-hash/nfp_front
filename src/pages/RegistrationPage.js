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
            alert('登録が完了しました。');
            // TODO: 登録後の画面遷移

        } catch (error) {
            console.error('Error during registration:', error);
            alert('登録中にエラーが発生しました。');
        }
    };

    return (
        <div>
            <h1>課題と通知条件の登録</h1>
            <form onSubmit={handleSubmit}>
                <fieldset>
                    <legend><h2>課題情報</h2></legend>
                    <div>
                        <label>タイトル:</label>
                        <input type="text" name="title" value={problemData.title} onChange={handleProblemChange} required />
                    </div>
                    <div>
                        <label>カテゴリ:</label>
                        <input type="text" name="category" value={problemData.category} onChange={handleProblemChange} required />
                    </div>
                    <div>
                        <label>課題の詳細:</label>
                        <textarea name="description" value={problemData.description} onChange={handleProblemChange} required />
                    </div>
                     {/* 他の課題項目も同様に追加 */}
                </fieldset>

                <hr />

                <fieldset>
                    <legend><h2>通知条件</h2></legend>
                    {techRequirements.map((requirement, index) => (
                        <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
                            <h4>通知条件 {index + 1}</h4>
                            <div>
                                <label>タイトル:</label>
                                <input type="text" name="title" value={requirement.title} onChange={(e) => handleTechRequirementChange(index, e)} required />
                            </div>
                            <div>
                                <label>詳細:</label>
                                <textarea name="description" value={requirement.description} onChange={(e) => handleTechRequirementChange(index, e)} required />
                            </div>
                            <div>
                                <label>技術カテゴリ:</label>
                                <input type="text" name="technology_category" value={requirement.technology_category} onChange={(e) => handleTechRequirementChange(index, e)} required />
                            </div>
                            <div>
                                <label>必須な技術要素:</label>
                                <textarea name="required_capabilities" value={requirement.required_capabilities} onChange={(e) => handleTechRequirementChange(index, e)} required />
                            </div>
                            <div>
                                <label>情報収集の範囲:</label>
                                <select name="info_scope" value={requirement.info_scope} onChange={(e) => handleTechRequirementChange(index, e)}>
                                    <option value="all_related">関連技術すべて</option>
                                    <option value="all_related(service_only)">関連技術すべて（サービスのみ）</option>
                                    <option value="problem_solving">課題解決に特化</option>
                                    <option value="problem_solving(service_only)">課題解決に特化（サービスのみ）</option>
                                </select>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addTechRequirement}>
                        通知条件を追加する
                    </button>
                </fieldset>

                <hr />

                <button type="submit">すべて登録</button>
            </form>
        </div>
    );
};

export default RegistrationPage;
