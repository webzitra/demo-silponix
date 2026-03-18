const { hashPassword, verifyPassword, createSession, verifySession, checkRateLimit, getClientIp, corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const headers = corsHeaders();

        // Session verification (with optional action)
        if (body.sessionToken) {
            const userId = verifySession(body.sessionToken);
            if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) };
            const user = await blobs.findUserById(userId);
            if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'User not found' }) };

            // Update profile name
            if (body.action === 'update-profile') {
                var updates = {};
                if (body.name) updates.name = body.name.trim();
                if (Object.keys(updates).length) {
                    await blobs.updateUser(userId, updates);
                    const updatedUser = await blobs.findUserById(userId);
                    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, user: sanitizeUser(updatedUser) }) };
                }
                return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
            }

            // Change password
            if (body.action === 'change-password') {
                if (!body.currentPassword || !body.newPassword) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Current and new password required' }) };
                if (body.newPassword.length < 6) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password must be at least 6 characters' }) };
                if (!verifyPassword(body.currentPassword, user.passwordHash)) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Current password is incorrect' }) };
                await blobs.updateUser(userId, { passwordHash: hashPassword(body.newPassword) });
                return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
            }

            // Change email
            if (body.action === 'change-email') {
                if (!body.password || !body.newEmail) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password and new email required' }) };
                if (!verifyPassword(body.password, user.passwordHash)) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Password is incorrect' }) };
                const existingUser = await blobs.findUserByEmail(body.newEmail);
                if (existingUser) return { statusCode: 409, headers, body: JSON.stringify({ error: 'Email already in use' }) };
                await blobs.changeUserEmail(userId, user.email, body.newEmail);
                const updated = await blobs.findUserById(userId);
                return { statusCode: 200, headers, body: JSON.stringify({ ok: true, user: sanitizeUser(updated), client: sanitizeUser(updated) }) };
            }

            // Delete account
            if (body.action === 'delete-account') {
                if (!body.password) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password required' }) };
                if (!verifyPassword(body.password, user.passwordHash)) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Password is incorrect' }) };
                await blobs.deleteUser(userId, user.email);
                return { statusCode: 200, headers, body: JSON.stringify({ ok: true, deleted: true }) };
            }

            // Newsletter check
            if (body.action === 'check-newsletter') {
                const subscribed = await blobs.isSubscribed(user.email);
                return { statusCode: 200, headers, body: JSON.stringify({ valid: true, subscribed, user: sanitizeUser(user), client: sanitizeUser(user) }) };
            }

            return { statusCode: 200, headers, body: JSON.stringify({ valid: true, user: sanitizeUser(user), client: sanitizeUser(user) }) };
        }

        // Email + password login
        if (!body.email || !body.password) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email and password required' }) };

        const ip = getClientIp(event);
        if (!checkRateLimit('auth:' + ip)) return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many attempts. Try again later.' }) };

        const user = await blobs.findUserByEmail(body.email);
        if (!user || !verifyPassword(body.password, user.passwordHash)) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
        }

        const session = createSession(user.id);
        return { statusCode: 200, headers, body: JSON.stringify({ valid: true, user: sanitizeUser(user), client: sanitizeUser(user), sessionToken: session.sessionToken, expiresAt: session.expiresAt }) };
    } catch (err) {
        console.error('[auth] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};

function sanitizeUser(user) {
    return { id: user.id, name: user.name, email: user.email, role: user.role || 'customer', createdAt: user.createdAt };
}
