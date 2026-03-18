const crypto = require('crypto');
const { verifySession, corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

async function verifyAdmin(body) {
    if (!body.sessionToken) return null;
    const userId = verifySession(body.sessionToken);
    if (!userId) return null;
    const user = await blobs.findUserById(userId);
    if (!user || user.role !== 'admin') return null;
    return user;
}

function wrapEmailHtml(subject, content) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
        '<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">' +
        '<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden">' +
        '<tr><td style="background:#c0392b;padding:24px 32px;text-align:center"><h1 style="margin:0;color:#fff;font-size:22px">SILPONIX</h1></td></tr>' +
        '<tr><td style="padding:32px;color:#e0e0e0;font-size:15px;line-height:1.6">' + content + '</td></tr>' +
        '<tr><td style="padding:24px 32px;border-top:1px solid #333;color:#888;font-size:12px;text-align:center">' +
        'Silponix — Závodní díly Honda & Motorsport<br>' +
        '<a href="' + (process.env.URL || 'https://silponix-demo.netlify.app') + '" style="color:#c0392b">silponix.cz</a>' +
        '</td></tr></table></td></tr></table></body></html>';
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const headers = corsHeaders();
        const action = body.action;

        // === Public actions ===

        if (action === 'subscribe') {
            const email = (body.email || '').trim().toLowerCase();
            if (!email || !email.includes('@')) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email' }) };
            await blobs.saveNewsletter(email);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        if (action === 'unsubscribe') {
            const email = (body.email || '').trim().toLowerCase();
            if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
            await blobs.deleteNewsletter(email);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        if (action === 'check') {
            const email = (body.email || '').trim().toLowerCase();
            const subscribed = await blobs.isSubscribed(email);
            return { statusCode: 200, headers, body: JSON.stringify({ subscribed }) };
        }

        // === Admin-only actions ===

        const admin = await verifyAdmin(body);
        if (!admin) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Admin access required' }) };

        if (action === 'list') {
            const subscribers = await blobs.getNewsletters();
            return { statusCode: 200, headers, body: JSON.stringify({ subscribers }) };
        }

        if (action === 'save-draft') {
            if (!body.subject) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Subject required' }) };
            const id = body.id || crypto.randomUUID();
            const draft = { id, subject: body.subject, content: body.content || '', updatedAt: new Date().toISOString() };
            await blobs.saveNewsletterDraft(draft);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true, id }) };
        }

        if (action === 'get-drafts') {
            const drafts = await blobs.getNewsletterDrafts();
            return { statusCode: 200, headers, body: JSON.stringify({ drafts: drafts.map(function (d) { return { id: d.id, subject: d.subject, updatedAt: d.updatedAt }; }) }) };
        }

        if (action === 'get') {
            if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID required' }) };
            var item = await blobs.getNewsletterDraft(body.id);
            if (!item) item = await blobs.getNewsletterSent(body.id);
            if (!item) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
            return { statusCode: 200, headers, body: JSON.stringify({ newsletter: item }) };
        }

        if (action === 'delete-draft') {
            if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID required' }) };
            await blobs.deleteNewsletterDraft(body.id);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        if (action === 'get-history') {
            const history = await blobs.getNewsletterHistory();
            return { statusCode: 200, headers, body: JSON.stringify({ history: history.map(function (h) { return { id: h.id, subject: h.subject, sentAt: h.sentAt, recipientCount: h.recipientCount }; }) }) };
        }

        if (action === 'send') {
            if (!body.subject || !body.content) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Subject and content required' }) };
            const subscribers = await blobs.getNewsletters();
            if (subscribers.length === 0) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No subscribers' }) };

            const id = body.id || crypto.randomUUID();
            const html = wrapEmailHtml(body.subject, body.content);
            let sent = 0, failed = 0;

            if (process.env.RESEND_API_KEY) {
                const { Resend } = require('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);
                for (const sub of subscribers) {
                    try {
                        await resend.emails.send({
                            from: 'Silponix <noreply@silponix.cz>',
                            to: sub.email,
                            subject: body.subject,
                            html: html
                        });
                        sent++;
                    } catch (emailErr) {
                        console.error('[newsletter] Send error to ' + sub.email + ':', emailErr.message);
                        failed++;
                    }
                }
            } else {
                console.log('[newsletter] RESEND_API_KEY not set, simulating send to ' + subscribers.length + ' subscribers');
                sent = subscribers.length;
            }

            // Save to history
            await blobs.saveNewsletterSent({
                id, subject: body.subject, content: body.content,
                sentAt: new Date().toISOString(), recipientCount: sent, failedCount: failed
            });

            // Remove draft if it existed
            if (body.id) {
                try { await blobs.deleteNewsletterDraft(body.id); } catch (e) { /* ignore */ }
            }

            return { statusCode: 200, headers, body: JSON.stringify({ ok: true, sent, failed }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
    } catch (err) {
        console.error('[newsletter] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
