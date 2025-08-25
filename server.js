const express = require('express');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;
const BACKEND_URL = 'https://newsdog-backend-1072071838370.asia-northeast1.run.app';

// Google Auth Library の初期化
// targetAudience を明示的に指定
const auth = new GoogleAuth({
    // Cloud Runの場合、targetAudienceはバックエンドのURLと同じ
    targetAudience: BACKEND_URL,
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Configuration endpoint for client-side
app.get('/config', (req, res) => {
    const config = {
        GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || ''
    };
    
    res.json(config);
});

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
            // IDトークンを取得
            console.log('Getting ID token for:', BACKEND_URL);
            const client = await auth.getIdTokenClient(BACKEND_URL);
            const headers = await client.getRequestHeaders();
            
            console.log('Got authorization header');
            
            // axiosを使用してリクエストを送信
            backendResponse = await axios({
                method: req.method,
                url: finalUrl,
                data: req.body,
                headers: {
                    ...headers, // Authorizationヘッダーが含まれる
                    'Content-Type': 'application/json',
                    // 必要に応じて元のリクエストヘッダーを転送
                    'X-Forwarded-For': req.ip,
                    'X-Original-Host': req.hostname
                },
                // タイムアウト設定
                timeout: 30000,
                // レスポンスタイプ
                responseType: 'json'
            });
            
            console.log('Authenticated request successful');
            
        } catch (authError) {
            console.error('Authentication error details:', {
                message: authError.message,
                code: authError.code,
                response: authError.response?.data
            });
            
            // 開発環境用のフォールバック（本番環境では削除推奨）
            if (process.env.NODE_ENV === 'development') {
                console.warn('Development mode: trying without auth');
                try {
                    backendResponse = await axios({
                        method: req.method,
                        url: finalUrl,
                        data: req.body,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    });
                } catch (directError) {
                    console.error('Direct request also failed:', directError.message);
                    throw directError;
                }
            } else {
                // 本番環境では認証エラーをそのまま返す
                throw authError;
            }
        }
        
        // レスポンスヘッダーの転送（必要に応じて）
        if (backendResponse.headers['content-type']) {
            res.setHeader('Content-Type', backendResponse.headers['content-type']);
        }
        
        res.status(backendResponse.status).json(backendResponse.data);
        
    } catch (error) {
        console.error('Proxy error details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            stack: error.stack
        });
        
        // エラーレスポンスの送信
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || error.message || 'Internal server error';
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            // 開発環境では詳細なエラー情報を含める
            ...(process.env.NODE_ENV === 'development' && {
                details: {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                }
            })
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});


// Google OAuth registration endpoint
app.post('/auth/google', async (req, res) => {
    try {
        console.log('=== Google OAuth Server-side Process ===');
        console.log('Request body:', req.body);
        
        const { access_token, purpose, industry, occupation, birth_date, plan, device_id, ip_address } = req.body;
        
        if (!access_token) {
            return res.status(400).json({
                success: false,
                error: 'Access token is required'
            });
        }
        
        // Googleからユーザー情報を取得・検証
        console.log('Fetching user info from Google...');
        const googleResponse = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`, {
            timeout: 10000
        });
        
        if (!googleResponse.data || !googleResponse.data.email) {
            throw new Error('Failed to get user info from Google');
        }
        
        const userInfo = googleResponse.data;
        console.log('Google user info:', { 
            email: userInfo.email, 
            name: userInfo.name, 
            verified_email: userInfo.verified_email 
        });
        
        // バックエンドAPIに認証付きでリクエスト送信
        const backendUrl = `${BACKEND_URL}/users/oauth/google`;
        console.log('Calling backend API:', backendUrl);
        
        const client = await auth.getIdTokenClient(BACKEND_URL);
        const headers = await client.getRequestHeaders();
        
        const backendResponse = await axios({
            method: 'POST',
            url: backendUrl,
            data: {
                access_token: access_token,
                purpose: purpose,
                industry: industry,
                occupation: occupation,
                birth_date: birth_date,
                plan: plan,
                device_id: device_id,
                ip_address: ip_address
            },
            headers: {
                ...headers, // Authorization header
                'Content-Type': 'application/json',
                'X-Forwarded-For': req.ip,
                'X-Original-Host': req.hostname
            },
            timeout: 30000
        });
        
        console.log('Backend response:', backendResponse.status);
        
        // 成功レスポンス
        res.status(backendResponse.status).json({
            success: true,
            message: 'Google user registered successfully',
            user_id: backendResponse.data.user_id,
            email: userInfo.email
        });
        
    } catch (error) {
        console.error('Google OAuth server-side error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // エラーレスポンス
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || error.message || 'Google OAuth registration failed';
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage
        });
    }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
});