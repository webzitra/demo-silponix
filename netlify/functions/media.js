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

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const headers = corsHeaders();
        const action = body.action;

        // Public actions
        if (action === 'gallery-list') {
            const items = await blobs.getMediaList({ tag: 'gallery' });
            return { statusCode: 200, headers, body: JSON.stringify({ items: items.map(m => ({ id: m.id, url: m.static ? m.url : '/api/media-serve/' + m.id, alt: m.alt || '', filename: m.filename, tags: m.tags || [] })) }) };
        }

        // Admin-only actions
        const admin = await verifyAdmin(body);
        if (!admin) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Admin access required' }) };

        if (action === 'upload') {
            if (!body.data || !body.filename) return { statusCode: 400, headers, body: JSON.stringify({ error: 'data and filename required' }) };
            const id = crypto.randomUUID();
            const base64Data = body.data.replace(/^data:[^;]+;base64,/, '');
            let buffer = Buffer.from(base64Data, 'base64');
            let contentType = body.type || 'image/jpeg';
            let filename = body.filename;

            // Auto-convert to WebP for optimization
            if (contentType.startsWith('image/') && contentType !== 'image/svg+xml' && contentType !== 'image/gif') {
                try {
                    const sharp = require('sharp');
                    buffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
                    contentType = 'image/webp';
                    filename = filename.replace(/\.[^.]+$/, '.webp');
                } catch (e) {
                    console.log('[media] sharp not available, storing original format');
                }
            }

            await blobs.saveMedia(id, buffer, contentType);
            await blobs.saveMediaMeta({
                id, filename, type: contentType,
                size: buffer.length, alt: body.alt || '', tags: body.tags || [],
                createdAt: new Date().toISOString()
            });

            return { statusCode: 201, headers, body: JSON.stringify({ id, url: '/api/media-serve/' + id }) };
        }

        if (action === 'list') {
            const media = await blobs.getMediaList();
            return { statusCode: 200, headers, body: JSON.stringify({ media: media.map(m => ({ ...m, url: m.static ? m.url : '/api/media-serve/' + m.id })) }) };
        }

        if (action === 'delete') {
            if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id required' }) };
            await blobs.deleteMedia(body.id);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        if (action === 'tag') {
            if (!body.id || !body.tags) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id and tags required' }) };
            const meta = await blobs.getMediaMeta(body.id);
            if (!meta) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Media not found' }) };
            const tags = [...new Set([...(meta.tags || []), ...body.tags])];
            await blobs.updateMediaTags(body.id, tags);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tags }) };
        }

        if (action === 'untag') {
            if (!body.id || !body.tags) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id and tags required' }) };
            const meta = await blobs.getMediaMeta(body.id);
            if (!meta) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Media not found' }) };
            const tags = (meta.tags || []).filter(t => !body.tags.includes(t));
            await blobs.updateMediaTags(body.id, tags);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true, tags }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
    } catch (err) {
        console.error('[media] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
