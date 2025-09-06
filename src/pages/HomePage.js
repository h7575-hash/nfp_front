import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
    const { t } = useTranslation('pages');
    const { user } = useAuth();
    
    // サンプル通知データ
    const notifications = [
        {
            id: 1,
            title: t('home.notifications.sampleData.newTech.title'),
            message: t('home.notifications.sampleData.newTech.message'),
            type: "success",
            date: "2025-08-09",
            isRead: false
        },
        {
            id: 2,
            title: t('home.notifications.sampleData.matching.title'),
            message: t('home.notifications.sampleData.matching.message'),
            type: "info",
            date: "2025-08-08",
            isRead: true
        },
        {
            id: 3,
            title: t('home.notifications.sampleData.report.title'),
            message: t('home.notifications.sampleData.report.message'),
            type: "info",
            date: "2025-08-07",
            isRead: true
        }
    ];

    return (
        <div className="container">
            <div className="page-header">
                <h1 className="page-title">{t('home.title')}</h1>
                <p className="page-subtitle">
                    {t('home.subtitle')}
                </p>
            </div>

            {/* 認証状態通知 */}
            {user && (
                <div className="verification-notices">
                    {!user.email_verified && (
                        <div className="verification-notice email-notice">
                            <div className="notice-icon">✉️</div>
                            <div className="notice-content">
                                <h3 className="notice-title">{t('home.verification.email.title')}</h3>
                                <p className="notice-message">{t('home.verification.email.message')}</p>
                                <Link to="/verify-email" className="notice-button btn btn-primary btn-sm">
                                    {t('home.verification.email.button')}
                                </Link>
                            </div>
                        </div>
                    )}
                    
                    {!user.card_registered && (
                        <div className="verification-notice card-notice">
                            <div className="notice-icon">💳</div>
                            <div className="notice-content">
                                <h3 className="notice-title">{t('home.verification.card.title')}</h3>
                                <p className="notice-message">{t('home.verification.card.message')}</p>
                                <Link to="/billing" className="notice-button btn btn-primary btn-sm">
                                    {t('home.verification.card.button')}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 通知セクション */}
            <section className="section">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">{t('home.notifications.title')}</h2>
                        <p className="card-subtitle">{notifications.filter(n => !n.isRead).length}{t('home.notifications.unreadCount')}</p>
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
                                {t('home.notifications.viewAll')}
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
                        <h3 className="feature-title">{t('home.actions.register.title')}</h3>
                        <p className="feature-description">
                            {t('home.actions.register.description')}
                        </p>
                        <Link to="/register" className="btn btn-primary">
                            {t('home.actions.register.button')}
                        </Link>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📋</div>
                        <h3 className="feature-title">{t('home.actions.problems.title')}</h3>
                        <p className="feature-description">
                            {t('home.actions.problems.description')}
                        </p>
                        <Link to="/problems" className="btn btn-secondary">
                            {t('home.actions.problems.button')}
                        </Link>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default HomePage;