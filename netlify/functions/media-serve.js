const { corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };

    // Accept GET and POST
    try {
        // Extract media ID from path: /api/media-serve/{id}
        const pathParts = event.path.split('/');
        const id = pathParts[pathParts.length - 1];

        if (!id || id === 'media-serve') {
            return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Media ID required' }) };
        }

        const media = await blobs.getMedia(id);
        if (!media) {
            return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Media not found' }) };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': media.contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*'
            },
            body: media.data.toString('base64'),
            isBase64Encoded: true
        };
    } catch (err) {
        console.error('[media-serve] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
