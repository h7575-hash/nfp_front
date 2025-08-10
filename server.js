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
        // Google Auth Libraryが自動でトークンを取得・管理
        const client = await auth.getIdTokenClient(BACKEND_URL);
        const apiPath = req.path.replace('/api', '');
        
        // 認証済みリクエストを送信（トークンは自動で付与される）
        const backendResponse = await client.request({
            method: req.method,
            url: `${BACKEND_URL}${apiPath}`,
            data: req.body,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
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