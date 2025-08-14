import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ServicePage = () => {
    const { t } = useTranslation('pages');
    
    return (
        <div>
            <section className="hero">
                <div className="container">
                    <h1 style={{whiteSpace: 'pre-line'}}>{t('service.hero.title')}</h1>
                    <p style={{whiteSpace: 'pre-line'}}>
                        {t('service.hero.subtitle')}
                    </p>
                    <Link to="/register" className="btn btn-accent metallic-gold">
                        {t('service.hero.cta')}
                    </Link>
                </div>
            </section>

            <section className="container">
                <div className="page-header">
                    <h2 className="page-title">{t('service.features.title')}</h2>
                    <p className="page-subtitle">
                        {t('service.features.subtitle')}
                    </p>
                </div>

                <div className="features-grid">
                    <div className="feature-card fade-in">
                        <div className="feature-icon">🎯</div>
                        <h3 className="feature-title">{t('service.features.matching.title')}</h3>
                        <p className="feature-description">
                            {t('service.features.matching.description')}
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
                    <Link to="/register" className="btn btn-accent metallic-gold">
                        {t('service.cta.button')}
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default ServicePage;