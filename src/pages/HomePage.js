import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
    // サンプル通知データ
    const notifications = [
        {
            id: 1,
            title: "新しい技術情報が見つかりました",
            message: "「自然言語処理による感情分析」に関する最新技術が公開されました。解決可能性: 85%",
            type: "success",
            date: "2025-08-09",
            isRead: false
        },
        {
            id: 2,
            title: "課題マッチング結果",
            message: "登録された「リアルタイム画像認識システム」について、新しい解決手法が発見されました。",
            type: "info",
            date: "2025-08-08",
            isRead: true
        },
        {
            id: 3,
            title: "定期レポート",
            message: "今週の技術動向レポートをお送りします。AI分野で3つの新しい進展がありました。",
            type: "info",
            date: "2025-08-07",
            isRead: true
        }
    ];

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">ダッシュボード</h1>
                <p className="page-subtitle">
                    最新の通知と登録された課題の状況をご確認ください
                </p>
            </div>

            {/* 通知セクション */}
            <section className="section">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📢 最新通知</h2>
                        <p className="card-subtitle">{notifications.filter(n => !n.isRead).length}件の未読通知があります</p>
                    </div>
                    <div className="card-body">
                        {notifications.map(notification => (
                            <div key={notification.id} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}>
                                <div className="notification-header">
                                    <h3 className="notification-title">{notification.title}</h3>
                                    <span className="notification-date">{notification.date}</span>
                                </div>
                                <p className="notification-message">{notification.message}</p>
                                {!notification.isRead && <div className="notification-badge"></div>}
                            </div>
                        ))}
                        <div className="text-center mt-4">
                            <Link to="/notifications" className="btn btn-secondary">
                                すべての通知を見る
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* アクションセクション */}
            <section className="section">
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">➕</div>
                        <h3 className="feature-title">新しい課題を登録</h3>
                        <p className="feature-description">
                            解決したい技術課題を登録して、最新情報をお知らせします。
                        </p>
                        <Link to="/register" className="btn btn-primary">
                            課題を登録する
                        </Link>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📋</div>
                        <h3 className="feature-title">登録済み課題</h3>
                        <p className="feature-description">
                            これまでに登録した課題の状況と進展をご確認いただけます。
                        </p>
                        <Link to="/problems" className="btn btn-secondary">
                            課題一覧を見る
                        </Link>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">ℹ️</div>
                        <h3 className="feature-title">サービス概要</h3>
                        <p className="feature-description">
                            News dogの機能と特徴について詳しくご紹介します。
                        </p>
                        <Link to="/service" className="btn btn-secondary">
                            サービス紹介を見る
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;