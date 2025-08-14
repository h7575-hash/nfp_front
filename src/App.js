import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom';
import RequestPage from './pages/RequestPage';
import HomePage from './pages/HomePage';
import ServicePage from './pages/ServicePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Sidebar />
                    <header className="app-header">
                        <div className="nav-container">
                            <Link to="/" className="logo">
                                <img src="/images/logo.png" alt="News dog" className="logo-image" />
                                <span>News dog</span>
                            </Link>
                        </div>
                    </header>
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={
                                <ProtectedRoute>
                                    <HomePage />
                                </ProtectedRoute>
                            } />
                            <Route path="/service" element={<ServicePage />} />
                            <Route path="/register" element={
                                <ProtectedRoute>
                                    <RequestPage />
                                </ProtectedRoute>
                            } />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />
                            <Route path="/settings" element={
                                <ProtectedRoute>
                                    <SettingsPage />
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </main>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
