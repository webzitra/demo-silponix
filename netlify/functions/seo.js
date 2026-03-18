const { verifySession, corsHeaders } = require('./lib/auth-helpers');
const blobs = require('./lib/blobs');

const SYSTEM_PROMPT = `Jsi SEO expert pro český e-shop Silponix — specialista na závodní díly Honda a motorsport.
Firma: Silponix, K. H. Máchy 34, 765 02 Otrokovice, Česká republika.

Generuj kompletní SEO metadata ve formátu JSON. Vše v češtině (kromě og:locale).
Odpověz POUZE validním JSON objektem, žádný text kolem.

Formát:
{
  "metaTitle": "max 60 znaků, obsahuje klíčová slova",
  "metaDescription": "max 160 znaků, výstižný popis obsahu",
  "ogTitle": "pro sdílení na sociálních sítích",
  "ogDescription": "max 200 znaků pro social media",
  "keywords": ["klíčové", "slovo", "max 10"],
  "schemaOrg": { kompletní Schema.org JSON-LD objekt },
  "faqSchema": [{"question": "Otázka?", "answer": "Odpověď."}, ...],
  "localBusiness": {
    "@type": "LocalBusiness",
    "name": "Silponix",
    "address": { "@type": "PostalAddress", "streetAddress": "K. H. Máchy 34", "addressLocality": "Otrokovice", "postalCode": "765 02", "addressCountry": "CZ" },
    "telephone": "+420 777 123 456",
    "url": "https://silponix.cz"
  },
  "aiSearchSummary": "2-3 věty shrnující obsah pro AI vyhledávače (Perplexity, ChatGPT Search, Google AI Overview)"
}`;

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

        if (!process.env.ANTHROPIC_API_KEY) {
            return { statusCode: 200, headers, body: JSON.stringify({ seo: generateFallbackSeo(body) }) };
        }

        let userPrompt = '';

        if (body.action === 'generate-post') {
            userPrompt = `Vygeneruj SEO metadata pro blog post:
Název: ${body.title || ''}
Kategorie: ${body.category || ''}
Obsah (zkrácený): ${(body.content || '').slice(0, 1000)}

Schema.org typ: Article, s author "Silponix Racing Team", datePublished "${body.date || new Date().toISOString()}".
Vygeneruj 2-3 relevantní FAQ otázky a odpovědi k tématu.`;
        } else if (body.action === 'generate-product') {
            userPrompt = `Vygeneruj SEO metadata pro produkt e-shopu:
Název: ${body.name || ''}
Kategorie: ${body.category || ''}
Popis: ${(body.desc || '').slice(0, 500)}
Cena: ${body.price || 0} Kč

Schema.org typ: Product, s offers (price: ${body.price}, priceCurrency: CZK, availability: InStock), brand: Silponix.
Vygeneruj 2-3 relevantní FAQ otázky a odpovědi o produktu.`;
        } else {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action. Use "generate-post" or "generate-product".' }) };
        }

        const Anthropic = require('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const msg = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }]
        });

        const text = msg.content[0].text;
        let seo;
        try {
            seo = JSON.parse(text);
        } catch {
            // Try to extract JSON from response
            const match = text.match(/\{[\s\S]*\}/);
            seo = match ? JSON.parse(match[0]) : generateFallbackSeo(body);
        }

        return { statusCode: 200, headers, body: JSON.stringify({ seo }) };
    } catch (err) {
        console.error('[seo] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'SEO generation failed', seo: generateFallbackSeo({}) }) };
    }
};

function generateFallbackSeo(body) {
    const title = body.title || body.name || 'Silponix';
    const desc = body.content || body.desc || '';
    return {
        metaTitle: (title + ' | Silponix').slice(0, 60),
        metaDescription: (desc.replace(/<[^>]*>/g, '').slice(0, 157) + '...'),
        ogTitle: title,
        ogDescription: desc.replace(/<[^>]*>/g, '').slice(0, 200),
        keywords: [title.toLowerCase(), 'silponix', 'honda', 'motorsport', 'závodní díly'],
        schemaOrg: null,
        faqSchema: [],
        localBusiness: null,
        aiSearchSummary: title + ' — Silponix, specialista na závodní díly Honda a motorsport.'
    };
}
