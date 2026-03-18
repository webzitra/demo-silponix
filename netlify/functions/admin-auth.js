const crypto = require('crypto');
const { checkRateLimit, getClientIp, corsHeaders } = require('./lib/auth-helpers');

const SESSION_DURATION = 8 * 60 * 60 * 1000;

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const headers = corsHeaders();

        // Session verification
        if (body.sessionToken) {
            const valid = verifyAdminSession(body.sessionToken);
            return { statusCode: valid ? 200 : 401, headers, body: JSON.stringify({ valid }) };
        }

        // Password login
        const ip = getClientIp(event);
        if (!checkRateLimit('admin:' + ip)) return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many attempts' }) };

        if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid password' }) };
        }

        const timestamp = Date.now().toString();
        const hmac = crypto.createHmac('sha256', process.env.TOKEN_SECRET).update('admin.' + timestamp).digest('hex');
        const sessionToken = 'admin.' + timestamp + '.' + hmac;

        return { statusCode: 200, headers, body: JSON.stringify({ sessionToken, expiresAt: Date.now() + SESSION_DURATION }) };
    } catch (err) {
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};

function verifyAdminSession(token) {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3 || parts[0] !== 'admin') return false;
    const [, timestamp, hmac] = parts;
    if (Date.now() - parseInt(timestamp) > SESSION_DURATION) return false;
    const expected = crypto.createHmac('sha256', process.env.TOKEN_SECRET).update('admin.' + timestamp).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'));
    } catch { return false; }
}
