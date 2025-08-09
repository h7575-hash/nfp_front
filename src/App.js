import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import HomePage from './pages/HomePage';
import ServicePage from './pages/ServicePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <header className="app-header">
                    <div className="nav-container">
                        <Link to="/" className="logo">
                            <img src="/images/logo.png" alt="News dog" className="logo-image" />
                            <span>News dog</span>
                        </Link>
                        <nav>
                            <ul className="nav-menu">
                                <li>
                                    <Link to="/" className="nav-link">ホーム</Link>
                                </li>
                                <li>
                                    <Link to="/service" className="nav-link">サービス</Link>
                                </li>
                                <li>
                                    <Link to="/register" className="nav-link">課題登録</Link>
                                </li>
                                <li>
                                    <Link to="/login" className="nav-link">ログイン</Link>
                                </li>
                                <li>
                                    <Link to="/signup" className="nav-link">新規登録</Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </header>
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/service" element={<ServicePage />} />
                        <Route path="/register" element={<RegistrationPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
