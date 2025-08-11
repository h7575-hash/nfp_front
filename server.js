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

// API proxy middleware - handle all /api/* requests
app.all('/api/*', async (req, res) => {
    try {
        // Extract the path after /api
        const requestedPath = req.originalUrl;
        console.log('=== API PROXY REQUEST ===');
        console.log('Full original URL:', requestedPath);
        console.log('Method:', req.method);
        console.log('Body:', req.body);
        
        // Convert /api/users -> /users
        let backendPath = requestedPath.replace(/^\/api/, '');
        if (!backendPath || backendPath === '/') {
            backendPath = '/';
        }
        
        console.log('Backend path:', backendPath);
        const finalUrl = `${BACKEND_URL}${backendPath}`;
        console.log('Final backend URL:', finalUrl);
        
        // 認証付きリクエストを送信
        let backendResponse;
        try {
            // Google Auth Libraryでサービスアカウント認証を試行
            console.log('Attempting authenticated request to:', finalUrl);
            const client = await auth.getIdTokenClient(BACKEND_URL);
            
            // client.requestを使用してIDトークン付きリクエストを送信
            const response = await client.request({
                url: finalUrl,
                method: req.method,
                data: req.body,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Authenticated request successful');
            backendResponse = { data: response.data, status: response.status };
        } catch (authError) {
            console.error('Authentication failed:', authError);
            console.warn('Authentication failed, trying without auth:', authError.message);
            // 認証失敗時は直接リクエスト（開発環境用）
            try {
                backendResponse = await axios({
                    method: req.method,
                    url: finalUrl,
                    data: req.body,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } catch (directRequestError) {
                console.error('Direct request also failed:', directRequestError.message);
                throw directRequestError;
            }
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