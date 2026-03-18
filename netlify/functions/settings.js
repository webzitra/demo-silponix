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

        const admin = await verifyAdmin(body);
        if (!admin) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Admin access required' }) };

        if (body.action === 'get') {
            const settings = await blobs.getSettings();
            return { statusCode: 200, headers, body: JSON.stringify({ settings }) };
        }

        if (body.action === 'save') {
            const current = await blobs.getSettings();
            // Allow saving full settings object or individual fields
            if (body.settings) {
                const s = body.settings;
                const fields = ['shopName', 'name', 'currency', 'email', 'phone', 'shippingCost', 'codFee', 'freeShippingFrom', 'freeShippingThreshold', 'productCategories', 'postCategories'];
                fields.forEach(f => { if (s[f] !== undefined) current[f] = s[f]; });
                ['shippingCost', 'codFee', 'freeShippingFrom', 'freeShippingThreshold', 'shippingPrice', 'codPrice'].forEach(f => {
                    if (s[f] !== undefined) current[f] = parseInt(s[f]) || 0;
                });
            } else {
                const fields = ['name', 'currency', 'email', 'phone', 'shippingCost', 'codFee', 'freeShippingThreshold'];
                fields.forEach(f => { if (body[f] !== undefined) current[f] = body[f]; });
                ['shippingCost', 'codFee', 'freeShippingThreshold'].forEach(f => {
                    if (body[f] !== undefined) current[f] = parseInt(body[f]) || 0;
                });
            }
            await blobs.saveSettings(current);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true, settings: current }) };
        }

        if (body.action === 'get-company') {
            const info = await blobs.getCompanyInfo();
            return { statusCode: 200, headers, body: JSON.stringify({ company: info }) };
        }

        if (body.action === 'save-company') {
            const fields = ['companyName', 'companyAddress', 'companyIco', 'companyEmail', 'companyPhone', 'companyHours'];
            const info = await blobs.getCompanyInfo();
            fields.forEach(f => { if (body[f] !== undefined) info[f] = body[f]; });
            await blobs.saveCompanyInfo(info);
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true, company: info }) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action. Use "get" or "save".' }) };
    } catch (err) {
        console.error('[settings] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
