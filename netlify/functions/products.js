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
        if (action === 'list') {
            const products = await blobs.getProducts();
            return { statusCode: 200, headers, body: JSON.stringify({ products }) };
        }

        if (action === 'get') {
            if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id required' }) };
            const product = await blobs.getProduct(body.id);
            if (!product) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Product not found' }) };
            return { statusCode: 200, headers, body: JSON.stringify({ product }) };
        }

        // Admin-only actions
        const admin = await verifyAdmin(body);
        if (!admin) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Admin access required' }) };

        if (action === 'create') {
            const product = {
                id: Date.now(),
                name: body.name || '',
                name_en: body.name_en || '',
                category: body.category || '',
                price: parseInt(body.price) || 0,
                desc: body.desc || '',
                desc_en: body.desc_en || '',
                desc_long: body.desc_long || '',
                desc_long_en: body.desc_long_en || '',
                specs: body.specs || [],
                specs_en: body.specs_en || [],
                badge: body.badge || '',
                stock: parseInt(body.stock) || 0,
                img: body.img || '',
                images: body.images || [],
                seo: body.seo || null,
                createdAt: new Date().toISOString()
            };
            await blobs.saveProduct(product);
            return { statusCode: 201, headers, body: JSON.stringify({ product }) };
        }

        if (action === 'update') {
            if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id required' }) };
            const existing = await blobs.getProduct(body.id);
            if (!existing) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Product not found' }) };

            const fields = ['name', 'name_en', 'category', 'price', 'desc', 'desc_en', 'desc_long', 'desc_long_en', 'specs', 'specs_en', 'badge', 'stock', 'img', 'images', 'seo'];
            fields.forEach(f => { if (body[f] !== undefined) existing[f] = body[f]; });
            if (body.price !== undefined) existing.price = parseInt(body.price) || 0;
            if (body.stock !== undefined) existing.stock = parseInt(body.stock) || 0;

            await blobs.saveProduct(existing);
            return { statusCode: 200, headers, body: JSON.stringify({ product: existing }) };
        }

        if (action === 'delete') {
            if (!body.id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id required' }) };
            await blobs.deleteProduct(body.id);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
    } catch (err) {
        console.error('[products] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
