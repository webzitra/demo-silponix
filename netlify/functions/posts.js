const { verifySession, corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

function slugify(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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
        if (action === 'list') {
            const isAdmin = body.sessionToken ? await verifyAdmin(body) : null;
            const posts = await blobs.getPosts(isAdmin ? false : true);
            return { statusCode: 200, headers, body: JSON.stringify({ posts: posts.map(p => ({ slug: p.slug, title: p.title, title_en: p.title_en, category: p.category, date: p.date, published: p.published, coverImage: p.coverImage, excerpt: p.excerpt, excerpt_en: p.excerpt_en })) }) };
        }

        if (action === 'get') {
            if (!body.slug) return { statusCode: 400, headers, body: JSON.stringify({ error: 'slug required' }) };
            const post = await blobs.getPost(body.slug);
            if (!post) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Post not found' }) };
            if (!post.published) {
                const isAdmin = body.sessionToken ? await verifyAdmin(body) : null;
                if (!isAdmin) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Post not found' }) };
            }
            return { statusCode: 200, headers, body: JSON.stringify({ post }) };
        }

        // Admin-only actions
        const admin = await verifyAdmin(body);
        if (!admin) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Admin access required' }) };

        if (action === 'create') {
            if (!body.title) return { statusCode: 400, headers, body: JSON.stringify({ error: 'title required' }) };
            const slug = body.slug || slugify(body.title);
            const existing = await blobs.getPost(slug);
            if (existing) return { statusCode: 409, headers, body: JSON.stringify({ error: 'Post with this slug already exists' }) };

            const post = {
                slug,
                title: body.title,
                title_en: body.title_en || '',
                content: body.content || '',
                content_en: body.content_en || '',
                excerpt: body.excerpt || '',
                excerpt_en: body.excerpt_en || '',
                category: body.category || '',
                coverImage: body.coverImage || '',
                images: body.images || [],
                galleryImages: body.galleryImages || [],
                date: new Date().toISOString().split('T')[0],
                published: body.published || false,
                seo: body.seo || null,
                createdAt: new Date().toISOString()
            };

            // Tag gallery images
            for (const mediaId of post.galleryImages) {
                try {
                    const meta = await blobs.getMediaMeta(mediaId);
                    if (meta) {
                        const tags = [...new Set([...(meta.tags || []), 'gallery'])];
                        await blobs.updateMediaTags(mediaId, tags);
                    }
                } catch (e) { /* skip */ }
            }

            await blobs.savePost(post);
            return { statusCode: 201, headers, body: JSON.stringify({ post }) };
        }

        if (action === 'update') {
            if (!body.slug) return { statusCode: 400, headers, body: JSON.stringify({ error: 'slug required' }) };
            const existing = await blobs.getPost(body.slug);
            if (!existing) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Post not found' }) };

            const fields = ['title', 'title_en', 'content', 'content_en', 'excerpt', 'excerpt_en', 'category', 'coverImage', 'images', 'galleryImages', 'published', 'seo'];
            fields.forEach(f => { if (body[f] !== undefined) existing[f] = body[f]; });

            // Re-tag gallery images
            if (body.galleryImages) {
                for (const mediaId of body.galleryImages) {
                    try {
                        const meta = await blobs.getMediaMeta(mediaId);
                        if (meta) {
                            const tags = [...new Set([...(meta.tags || []), 'gallery'])];
                            await blobs.updateMediaTags(mediaId, tags);
                        }
                    } catch (e) { /* skip */ }
                }
            }

            await blobs.savePost(existing);
            return { statusCode: 200, headers, body: JSON.stringify({ post: existing }) };
        }

        if (action === 'delete') {
            if (!body.slug) return { statusCode: 400, headers, body: JSON.stringify({ error: 'slug required' }) };
            await blobs.deletePost(body.slug);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        if (action === 'publish') {
            if (!body.slug) return { statusCode: 400, headers, body: JSON.stringify({ error: 'slug required' }) };
            const post = await blobs.getPost(body.slug);
            if (!post) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Post not found' }) };
            post.published = body.published !== false;
            await blobs.savePost(post);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true, published: post.published }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
    } catch (err) {
        console.error('[posts] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
