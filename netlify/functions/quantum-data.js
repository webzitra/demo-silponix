// netlify/functions/quantum-data.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CACHE_SECONDS    = 300; // 5 min cache

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
        'Access-Control-Allow-Origin': '*',
    };

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase not configured' }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const type     = (event.queryStringParameters || {}).type || 'all';

    try {
        const result = {};

        if (type === 'all' || type === 'testimonials') {
            const { data, error } = await supabase
                .from('testimonials')
                .select('id, name, company, role, text, rating, avatar_url')
                .eq('active', true)
                .order('id');
            if (error) throw error;
            result.testimonials = data;
        }

        if (type === 'all' || type === 'stats') {
            const { data, error } = await supabase
                .from('site_stats')
                .select('key, value, suffix, label_cs, label_en')
                .order('id');
            if (error) throw error;
            result.stats = data;
        }

        return { statusCode: 200, headers, body: JSON.stringify(result) };
    } catch (err) {
        console.error('quantum-data error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
