const crypto = require('crypto');

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
const rateLimitMap = new Map();

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return salt + ':' + hash;
}

function verifyPassword(password, stored) {
    const [salt, storedHash] = stored.split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hash, 'hex'));
}

function createSession(userId) {
    const timestamp = Date.now().toString();
    const secret = process.env.TOKEN_SECRET || 'silponix-demo-local-secret';
    const hmac = crypto.createHmac('sha256', secret).update(userId + '.' + timestamp).digest('hex');
    return {
        sessionToken: userId + '.' + timestamp + '.' + hmac,
        expiresAt: Date.now() + SESSION_DURATION
    };
}

function verifySession(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [userId, timestamp, hmac] = parts;
    if (Date.now() - parseInt(timestamp) > SESSION_DURATION) return null;
    const secret = process.env.TOKEN_SECRET || 'silponix-demo-local-secret';
    const expected = crypto.createHmac('sha256', secret).update(userId + '.' + timestamp).digest('hex');
    try {
        if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))) return null;
    } catch { return null; }
    return userId;
}

function checkRateLimit(key, maxAttempts, windowMs) {
    maxAttempts = maxAttempts || 5;
    windowMs = windowMs || 60000;
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now - entry.start > windowMs) {
        rateLimitMap.set(key, { start: now, count: 1 });
        return true;
    }
    entry.count++;
    if (entry.count > maxAttempts) return false;
    return true;
}

function getClientIp(event) {
    return event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };
}

module.exports = { hashPassword, verifyPassword, createSession, verifySession, checkRateLimit, getClientIp, corsHeaders };
