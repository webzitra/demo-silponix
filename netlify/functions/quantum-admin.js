// netlify/functions/quantum-admin.js
const { neon } = require('@neondatabase/serverless');

const ADMIN_TOKEN = process.env.ADMIN_SECRET || process.env.TOKEN_SECRET;

function authenticate(event) {
    const auth = (event.headers['authorization'] || '').replace('Bearer ', '');
    return auth === ADMIN_TOKEN;
}

const ALLOWED_TABLES = ['testimonials', 'site_stats'];

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

    if (!process.env.DATABASE_URL) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'DATABASE_URL not configured' }) };
    }

    const sql = neon(process.env.DATABASE_URL);
    const { action, table, id, data } = JSON.parse(event.body || '{}');

    if (!ALLOWED_TABLES.includes(table)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid table' }) };
    }

    try {
        let rows;

        if (action === 'list') {
            rows = table === 'testimonials'
                ? await sql`SELECT * FROM testimonials ORDER BY id`
                : await sql`SELECT * FROM site_stats ORDER BY id`;

        } else if (action === 'upsert') {
            if (table === 'testimonials') {
                const d = data;
                rows = d.id
                    ? await sql`
                        UPDATE testimonials
                        SET name=${d.name}, company=${d.company}, role=${d.role},
                            text=${d.text}, rating=${d.rating ?? 5},
                            avatar_url=${d.avatar_url ?? null}, active=${d.active ?? true}
                        WHERE id=${d.id}
                        RETURNING *`
                    : await sql`
                        INSERT INTO testimonials (name, company, role, text, rating, avatar_url, active)
                        VALUES (${d.name}, ${d.company}, ${d.role}, ${d.text},
                                ${d.rating ?? 5}, ${d.avatar_url ?? null}, ${d.active ?? true})
                        RETURNING *`;
            } else {
                const d = data;
                rows = await sql`
                    INSERT INTO site_stats (key, value, suffix, label_cs, label_en)
                    VALUES (${d.key}, ${d.value}, ${d.suffix ?? ''}, ${d.label_cs ?? ''}, ${d.label_en ?? ''})
                    ON CONFLICT (key) DO UPDATE
                    SET value=${d.value}, suffix=${d.suffix ?? ''}, label_cs=${d.label_cs ?? ''}, label_en=${d.label_en ?? ''}
                    RETURNING *`;
            }

        } else if (action === 'delete') {
            rows = table === 'testimonials'
                ? await sql`DELETE FROM testimonials WHERE id=${id} RETURNING id`
                : await sql`DELETE FROM site_stats WHERE id=${id} RETURNING id`;

        } else {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify({ data: rows }) };
    } catch (err) {
        console.error('quantum-admin error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
