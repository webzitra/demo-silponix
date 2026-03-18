const { verifySession, corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const headers = corsHeaders();

        if (!body.sessionToken) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };

        const userId = verifySession(body.sessionToken);
        if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) };

        // Admin access — return all orders
        const user = await blobs.findUserById(userId);
        if (user && user.role === 'admin') {
            return { statusCode: 200, headers, body: JSON.stringify({ orders: await blobs.getOrders() }) };
        }

        // Customer access — return only their orders
        return { statusCode: 200, headers, body: JSON.stringify({ orders: await blobs.getOrdersByUserId(userId) }) };
    } catch (err) {
        console.error('[orders] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
