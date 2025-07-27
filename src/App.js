import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link
} from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';

function App() {
    return (
        <Router>
            <div>
                <nav>
                    <ul>
                        <li>
                            <Link to="/register">課題・通知条件登録</Link>
                        </li>
                    </ul>
                </nav>
                <hr />
                <Routes>
                    <Route path="/register" element={<RegistrationPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
