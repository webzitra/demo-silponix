const crypto = require('crypto');
const { hashPassword, checkRateLimit, getClientIp, corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

const RESET_TOKEN_DURATION = 24 * 60 * 60 * 1000; // 24 hours

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const headers = corsHeaders();
        const ip = getClientIp(event);

        // Request reset link
        if (body.action === 'request') {
            if (!checkRateLimit('reset-req:' + ip, 3, 300000)) {
                return { statusCode: 200, headers, body: JSON.stringify({ message: 'If this email is registered, you will receive a password reset link.' }) };
            }

            const email = (body.email || '').toLowerCase().trim();
            if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };

            const user = await blobs.findUserByEmail(email);
            if (user) {
                const token = crypto.randomBytes(32).toString('hex');
                await blobs.saveResetToken(token, { userId: user.id, email: user.email, expiresAt: Date.now() + RESET_TOKEN_DURATION });

                if (process.env.RESEND_API_KEY) {
                    try {
                        const { Resend } = require('resend');
                        const resend = new Resend(process.env.RESEND_API_KEY);
                        const resetUrl = (process.env.URL || 'https://silponix-demo.netlify.app') + '/klient/reset.html?token=' + token;
                        await resend.emails.send({
                            from: 'Silponix <noreply@silponix.cz>',
                            to: user.email,
                            subject: 'Obnovení hesla — Silponix',
                            html: '<h2>Obnovení hesla</h2><p>Klikněte na odkaz níže pro obnovení hesla:</p><p><a href="' + resetUrl + '">' + resetUrl + '</a></p><p>Odkaz je platný 24 hodin.</p>'
                        });
                    } catch (emailErr) {
                        console.error('Reset email error:', emailErr.message);
                    }
                }
            }

            return { statusCode: 200, headers, body: JSON.stringify({ message: 'If this email is registered, you will receive a password reset link.' }) };
        }

        // Set new password
        if (body.action === 'set') {
            if (!body.resetToken || !body.password) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Token and new password are required' }) };
            }
            if (body.password.length < 6) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password must be at least 6 characters' }) };
            }

            if (!checkRateLimit('reset-set:' + ip, 5, 60000)) {
                return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many attempts. Try again later.' }) };
            }

            const tokenData = await blobs.getResetToken(body.resetToken);
            if (!tokenData || Date.now() > tokenData.expiresAt) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid or expired reset token' }) };
            }

            const newHash = hashPassword(body.password);
            await blobs.updateUser(tokenData.userId, { passwordHash: newHash });
            await blobs.deleteResetToken(body.resetToken);

            return { statusCode: 200, headers, body: JSON.stringify({ message: 'Password has been reset successfully.' }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action. Use "request" or "set".' }) };
    } catch (err) {
        console.error('[reset-password] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
