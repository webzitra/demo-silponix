const { hashPassword, createSession, checkRateLimit, getClientIp, corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');
const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const headers = corsHeaders();

        const ip = getClientIp(event);
        if (!checkRateLimit('register:' + ip, 3)) return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many attempts' }) };

        if (!body.name || !body.email || !body.password) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name, email and password required' }) };
        if (body.password.length < 6) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password must be at least 6 characters' }) };

        const email = body.email.toLowerCase().trim();
        const existing = await blobs.findUserByEmail(email);
        if (existing) return { statusCode: 409, headers, body: JSON.stringify({ error: 'Email already registered' }) };

        const user = {
            id: crypto.randomUUID(),
            name: body.name.trim(),
            email: email,
            passwordHash: hashPassword(body.password),
            role: 'customer',
            createdAt: new Date().toISOString()
        };

        await blobs.saveUser(user);
        const session = createSession(user.id);

        return { statusCode: 201, headers, body: JSON.stringify({ user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }, sessionToken: session.sessionToken, expiresAt: session.expiresAt }) };
    } catch (err) {
        console.error('[register] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
