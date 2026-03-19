// netlify/functions/quantum-admin.js
const { createClient } = require('@supabase/supabase-js');

// Reuse existing admin auth pattern
const ADMIN_TOKEN = process.env.ADMIN_SECRET || process.env.TOKEN_SECRET;

function authenticate(event) {
    const auth = (event.headers['authorization'] || '').replace('Bearer ', '');
    return auth === ADMIN_TOKEN;
}

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    if (!authenticate(event))           return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { action, table, id, data } = JSON.parse(event.body || '{}');

    const ALLOWED_TABLES = ['testimonials', 'site_stats'];
    if (!ALLOWED_TABLES.includes(table)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid table' }) };
    }

    try {
        let result;
        if (action === 'list') {
            result = await supabase.from(table).select('*').order('id');
        } else if (action === 'upsert') {
            result = await supabase.from(table).upsert(data).select();
        } else if (action === 'delete') {
            result = await supabase.from(table).delete().eq('id', id);
        } else {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
        }
        if (result.error) throw result.error;
        return { statusCode: 200, headers, body: JSON.stringify({ data: result.data }) };
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
