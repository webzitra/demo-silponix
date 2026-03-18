// Edge function: inject SEO meta tags into blog/post.html for crawlers
// This runs at the edge (Deno) and modifies HTML before it reaches the client.

export default async (request, context) => {
    const url = new URL(request.url);

    // Only intercept /blog/post.html with a slug parameter
    if (!url.pathname.startsWith('/blog/post.html')) {
        return;
    }

    const slug = url.searchParams.get('slug');
    if (!slug) return;

    // Fetch the original page
    const response = await context.next();
    const html = await response.text();

    // Fetch post SEO data from the API
    try {
        const apiUrl = new URL('/api/posts', url.origin);
        const apiRes = await fetch(apiUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get', slug: slug })
        });
        const data = await apiRes.json();

        if (!data.post) {
            return new Response(html, { headers: response.headers });
        }

        const post = data.post;
        const seo = post.seo || {};
        let modified = html;

        // Inject title
        if (seo.metaTitle || post.title) {
            modified = modified.replace(
                /<title>[^<]*<\/title>/,
                '<title>' + escapeHtml(seo.metaTitle || post.title) + ' | Silponix Blog</title>'
            );
        }

        // Inject meta description
        if (seo.metaDescription || post.excerpt) {
            modified = modified.replace(
                /<meta name="description" content="[^"]*">/,
                '<meta name="description" content="' + escapeHtml(seo.metaDescription || post.excerpt) + '">'
            );
        }

        // Build additional meta tags to inject before </head>
        const metaTags = [];

        // OG tags
        const ogTitle = seo.ogTitle || seo.metaTitle || post.title;
        const ogDesc = seo.ogDescription || seo.metaDescription || post.excerpt;
        const ogImage = seo.ogImage || post.coverImage;

        if (ogTitle) metaTags.push('<meta property="og:title" content="' + escapeHtml(ogTitle) + '">');
        if (ogDesc) metaTags.push('<meta property="og:description" content="' + escapeHtml(ogDesc) + '">');
        if (ogImage) metaTags.push('<meta property="og:image" content="' + escapeHtml(ogImage) + '">');
        metaTags.push('<meta property="og:type" content="article">');
        metaTags.push('<meta property="og:url" content="' + escapeHtml(url.toString()) + '">');

        // Twitter card
        metaTags.push('<meta name="twitter:card" content="summary_large_image">');

        // Schema.org JSON-LD
        if (seo.schemaOrg) {
            metaTags.push('<script type="application/ld+json">' + JSON.stringify(seo.schemaOrg) + '</script>');
        }

        // FAQ Schema (AEO)
        if (seo.faqSchema && seo.faqSchema.length) {
            const faqLD = {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: seo.faqSchema.map(f => ({
                    '@type': 'Question',
                    name: f.question,
                    acceptedAnswer: { '@type': 'Answer', text: f.answer }
                }))
            };
            metaTags.push('<script type="application/ld+json">' + JSON.stringify(faqLD) + '</script>');
        }

        // AI search summary (as hidden meta)
        if (seo.aiSearchSummary) {
            metaTags.push('<meta name="ai-summary" content="' + escapeHtml(seo.aiSearchSummary) + '">');
        }

        // Keywords
        if (seo.keywords && seo.keywords.length) {
            metaTags.push('<meta name="keywords" content="' + escapeHtml(seo.keywords.join(', ')) + '">');
        }

        if (metaTags.length) {
            modified = modified.replace('</head>', metaTags.join('\n    ') + '\n</head>');
        }

        return new Response(modified, {
            headers: response.headers
        });
    } catch (err) {
        // On error, return original HTML
        return new Response(html, { headers: response.headers });
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const config = {
    path: '/blog/post.html'
};
