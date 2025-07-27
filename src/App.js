import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <header className="app-header">
                    <div className="nav-container">
                        <Link to="/" className="logo">
                            <div className="logo-icon">NFP</div>
                            <span>News for Problem</span>
                        </Link>
                        <nav>
                            <ul className="nav-menu">
                                <li>
                                    <Link to="/" className="nav-link">ホーム</Link>
                                </li>
                                <li>
                                    <Link to="/register" className="nav-link">課題登録</Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </header>
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/register" element={<RegistrationPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
