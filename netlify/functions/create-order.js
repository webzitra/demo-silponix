const { verifySession, corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };

    try {
        const body = JSON.parse(event.body);
        const headers = corsHeaders();

        if (!body.items || !body.items.length) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Cart is empty' }) };
        if (!body.customer || !body.customer.name || !body.customer.email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Customer details required' }) };

        let userId = null;
        if (body.sessionToken) {
            userId = verifySession(body.sessionToken);
        }

        const order = await blobs.addOrder({
            userId: userId,
            items: body.items,
            customer: {
                name: body.customer.name,
                email: body.customer.email,
                phone: body.customer.phone || '',
                address: body.customer.address || '',
                city: body.customer.city || '',
                zip: body.customer.zip || '',
                note: body.customer.note || ''
            },
            total: body.total || 0,
            shipping: body.shipping || 0,
            paymentMethod: 'sandbox',
            paymentStatus: 'demo_paid'
        });

        return { statusCode: 201, headers, body: JSON.stringify({ orderId: order.id, status: order.status, message: 'Objednávka vytvořena (sandbox mode)' }) };
    } catch (err) {
        console.error('[create-order] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
