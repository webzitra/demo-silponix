const crypto = require('crypto');
const { corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const headers = corsHeaders();

        const { name, email, phone, subject, message } = body;

        // Validation
        if (!name || !name.trim()) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Jméno je povinné' }) };
        if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Neplatný e-mail' }) };
        if (!message || !message.trim()) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Zpráva je povinná' }) };

        // Save message
        const msg = {
            id: crypto.randomUUID(),
            name: name.trim(),
            email: email.trim(),
            phone: (phone || '').trim(),
            subject: (subject || '').trim(),
            message: message.trim(),
            read: false,
            createdAt: new Date().toISOString()
        };
        await blobs.saveMessage(msg);

        // Send email notification
        try {
            const settings = await blobs.getSettings();
            const adminEmail = settings.email || 'mezihorak@silponix.cz';
            const RESEND_KEY = process.env.RESEND_API_KEY;

            if (RESEND_KEY) {
                const { Resend } = require('resend');
                const resend = new Resend(RESEND_KEY);
                await resend.emails.send({
                    from: 'Silponix <noreply@silponix.cz>',
                    to: adminEmail,
                    subject: 'Nová zpráva z kontaktního formuláře: ' + (msg.subject || 'Bez předmětu'),
                    html: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">' +
                        '<h2 style="color:#c0392b">Nová zpráva z webu</h2>' +
                        '<table style="width:100%;border-collapse:collapse">' +
                        '<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">Jméno</td><td style="padding:8px;border-bottom:1px solid #eee">' + msg.name + '</td></tr>' +
                        '<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">E-mail</td><td style="padding:8px;border-bottom:1px solid #eee"><a href="mailto:' + msg.email + '">' + msg.email + '</a></td></tr>' +
                        (msg.phone ? '<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">Telefon</td><td style="padding:8px;border-bottom:1px solid #eee">' + msg.phone + '</td></tr>' : '') +
                        '<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee">Předmět</td><td style="padding:8px;border-bottom:1px solid #eee">' + (msg.subject || '—') + '</td></tr>' +
                        '<tr><td style="padding:8px;font-weight:bold" colspan="2">Zpráva:</td></tr>' +
                        '<tr><td colspan="2" style="padding:8px;white-space:pre-wrap">' + msg.message + '</td></tr>' +
                        '</table></div>'
                });
            } else {
                console.log('[contact] RESEND_API_KEY not set, skipping email to', adminEmail);
            }
        } catch (emailErr) {
            console.error('[contact] Email error:', emailErr.message);
        }

        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (err) {
        console.error('[contact] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
