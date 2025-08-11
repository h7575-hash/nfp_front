const express = require('express');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;
const BACKEND_URL = 'https://newsdog-backend-1072071838370.asia-northeast1.run.app';

// Google Auth Library の初期化
const auth = new GoogleAuth();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

app.use('/api/*', async (req, res) => {
    try {
        // Extract the path after /api
        // req.url includes the full path, req.path is processed by middleware
        const fullPath = req.originalUrl || req.url;
        console.log('Full original URL:', fullPath);
        console.log('req.path:', req.path);
        console.log('req.url:', req.url);
        
        // /api/users -> /users
        let apiPath = fullPath.replace('/api', '');
        if (!apiPath || apiPath === '/') {
            apiPath = '/';
        }
        
        console.log('API path to backend:', apiPath);
        console.log('Final URL:', `${BACKEND_URL}${apiPath}`);
        
        // 認証付きリクエストを送信
        let backendResponse;
        try {
            // Google Auth Libraryでサービスアカウント認証を試行
            const client = await auth.getIdTokenClient(BACKEND_URL);
            backendResponse = await client.request({
                method: req.method,
                url: `${BACKEND_URL}${apiPath}`,
                data: req.body,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (authError) {
            console.warn('Authentication failed, trying without auth:', authError.message);
            // 認証失敗時は直接リクエスト（開発環境用）
            backendResponse = await axios({
                method: req.method,
                url: `${BACKEND_URL}${apiPath}`,
                data: req.body,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        res.json(backendResponse.data);
    } catch (error) {
        console.error('Proxy error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || 'Internal server error'
        });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});