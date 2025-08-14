import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { t } = useTranslation('common');
    const { isAuthenticated, logout } = useAuth();
    
    // 開発環境チェック
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <>
            <button 
                className={`sidebar-toggle ${isOpen ? 'hidden' : ''}`}
                onClick={toggleSidebar}
                aria-label="メニューを開く"
            >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
            </button>

            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
            
            <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo" onClick={closeSidebar}>
                        <img src="/images/logo.png" alt={t('brand.name')} className="sidebar-logo-image" />
                        <span>{t('brand.name')}</span>
                    </Link>
                    <button className="sidebar-close" onClick={closeSidebar} aria-label="メニューを閉じる">
                        ×
                    </button>
                </div>
                
                <div className="sidebar-menu">
                    <div className="sidebar-main-links">
                        <Link 
                            to="/service" 
                            className={`sidebar-link ${isActive('/service') ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <span className="sidebar-link-icon">⚙️</span>
                            <span>{t('navigation.service')}</span>
                        </Link>
                        
                        {(isAuthenticated || isDevelopment) ? (
                            <>
                                <Link 
                                    to="/" 
                                    className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <span className="sidebar-link-icon">🏠</span>
                                    <span>{t('navigation.home')}</span>
                                </Link>
                                <Link 
                                    to="/register" 
                                    className={`sidebar-link ${isActive('/register') ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <span className="sidebar-link-icon">📝</span>
                                    <span>{t('navigation.register')}</span>
                                </Link>
                                {isDevelopment && (
                                    <>
                                        <Link 
                                            to="/login" 
                                            className={`sidebar-link ${isActive('/login') ? 'active' : ''}`}
                                            onClick={closeSidebar}
                                        >
                                            <span className="sidebar-link-icon">🔑</span>
                                            <span>{t('navigation.login')} (Dev)</span>
                                        </Link>
                                        <Link 
                                            to="/signup" 
                                            className={`sidebar-link ${isActive('/signup') ? 'active' : ''}`}
                                            onClick={closeSidebar}
                                        >
                                            <span className="sidebar-link-icon">👤</span>
                                            <span>{t('navigation.signup')} (Dev)</span>
                                        </Link>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <Link 
                                    to="/login" 
                                    className={`sidebar-link ${isActive('/login') ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <span className="sidebar-link-icon">🔑</span>
                                    <span>{t('navigation.login')}</span>
                                </Link>
                                <Link 
                                    to="/signup" 
                                    className={`sidebar-link ${isActive('/signup') ? 'active' : ''}`}
                                    onClick={closeSidebar}
                                >
                                    <span className="sidebar-link-icon">👤</span>
                                    <span>{t('navigation.signup')}</span>
                                </Link>
                            </>
                        )}
                    </div>
                    
                    {(isAuthenticated || isDevelopment) && (
                        <div className="sidebar-bottom-links">
                            <Link 
                                to="/settings" 
                                className={`sidebar-link ${isActive('/settings') ? 'active' : ''}`}
                                onClick={closeSidebar}
                            >
                                <span className="sidebar-link-icon">⚙️</span>
                                <span>{t('navigation.settings')}</span>
                            </Link>
                            {isAuthenticated && (
                                <button 
                                    className="sidebar-link logout-button"
                                    onClick={() => {
                                        if (window.confirm(t('messages.logoutConfirm'))) {
                                            logout();
                                            closeSidebar();
                                        }
                                    }}
                                >
                                    <span className="sidebar-link-icon">🚪</span>
                                    <span>{t('navigation.logout')}</span>
                                </button>
                            )}
                            {isDevelopment && !isAuthenticated && (
                                <div className="sidebar-link" style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                    <span className="sidebar-link-icon">🔧</span>
                                    <span>Development Mode</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
}

export default Sidebar;