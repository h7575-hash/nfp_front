import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div>
            <section className="hero">
                <div className="container">
                    <h1>課題解決の新たな可能性を発見</h1>
                    <p>
                        過去に技術的制約で諦めた課題が、最新のAI技術によって解決可能になったかもしれません。
                        あなたの課題を登録して、解決のチャンスを見つけましょう。
                    </p>
                    <Link to="/register" className="btn btn-primary">
                        課題を登録する
                    </Link>
                </div>
            </section>

            <section className="container">
                <div className="page-header">
                    <h2 className="page-title">サービスの特徴</h2>
                    <p className="page-subtitle">
                        最新のAI技術動向と企業課題をマッチングし、新たなソリューションの可能性をお届けします
                    </p>
                </div>

                <div className="features-grid">
                    <div className="feature-card fade-in">
                        <div className="feature-icon">🎯</div>
                        <h3 className="feature-title">課題特化型マッチング</h3>
                        <p className="feature-description">
                            過去に技術的制約で諦めた具体的な課題を詳細に分析し、
                            最新のAI技術で解決可能かどうかを評価します。
                        </p>
                    </div>

                    <div className="feature-card fade-in">
                        <div className="feature-icon">🔄</div>
                        <h3 className="feature-title">リアルタイム技術監視</h3>
                        <p className="feature-description">
                            主要なAI研究機関、学術論文、オープンソースプロジェクトを
                            常時監視し、最新の技術動向をキャッチアップします。
                        </p>
                    </div>

                    <div className="feature-card fade-in">
                        <div className="feature-icon">🤖</div>
                        <h3 className="feature-title">AI による解決可能性評価</h3>
                        <p className="feature-description">
                            大規模言語モデルを活用して、収集した技術情報が
                            あなたの課題を解決できる可能性を自動的に評価します。
                        </p>
                    </div>

                    <div className="feature-card fade-in">
                        <div className="feature-icon">📧</div>
                        <h3 className="feature-title">タイムリーな通知</h3>
                        <p className="feature-description">
                            解決可能性の高い技術が見つかった場合、
                            詳細な分析結果と関連リソースをメールでお知らせします。
                        </p>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <h3 className="mb-4">まずは課題を登録してみませんか？</h3>
                    <p className="text-secondary mb-6">
                        登録は無料です。あなたの課題が最新技術で解決できるかもしれません。
                    </p>
                    <Link to="/register" className="btn btn-success">
                        無料で課題を登録する
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default HomePage;