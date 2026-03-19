// netlify/functions/quantum-data.js
const { neon } = require('@neondatabase/serverless');

const CACHE_SECONDS = 300; // 5 min cache

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
        'Access-Control-Allow-Origin': '*',
    };

    if (!process.env.DATABASE_URL) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'DATABASE_URL not configured' }) };
    }

    const sql = neon(process.env.DATABASE_URL);
    const type = (event.queryStringParameters || {}).type || 'all';

    try {
        const result = {};

        if (type === 'all' || type === 'testimonials') {
            result.testimonials = await sql`
                SELECT id, name, company, role, text, rating, avatar_url
                FROM testimonials
                WHERE active = true
                ORDER BY id
            `;
        }

        if (type === 'all' || type === 'stats') {
            result.stats = await sql`
                SELECT key, value, suffix, label_cs, label_en
                FROM site_stats
                ORDER BY id
            `;
        }

        return { statusCode: 200, headers, body: JSON.stringify(result) };
    } catch (err) {
        console.error('quantum-data error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
