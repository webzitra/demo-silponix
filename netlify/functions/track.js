const { corsHeaders, getClientIp, checkRateLimit } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders() };
    if (event.httpMethod !== 'POST') return { statusCode: 204 };

    try {
        const ip = getClientIp(event);
        if (!checkRateLimit('track:' + ip, 100, 60000)) return { statusCode: 204 };

        const body = JSON.parse(event.body || '{}');
        const page = (body.page || '/').replace(/[?#].*/, '');

        await blobs.trackPageView(page, ip);

        return { statusCode: 204 };
    } catch (err) {
        return { statusCode: 204 };
    }
};
