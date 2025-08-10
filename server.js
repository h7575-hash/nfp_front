const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 8080;
const BACKEND_URL = 'https://newsdog-backend-1072071838370.asia-northeast1.run.app';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

async function getAccessToken() {
    try {
        const response = await axios.get(
            'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
            {
                headers: {
                    'Metadata-Flavor': 'Google'
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Failed to get access token:', error);
        throw error;
    }
}

app.use('/api/*', async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        const apiPath = req.path.replace('/api', '');
        
        const backendResponse = await axios({
            method: req.method,
            url: `${BACKEND_URL}${apiPath}`,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
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