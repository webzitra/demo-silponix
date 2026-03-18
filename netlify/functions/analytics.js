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

        // Support both period string ('7d') and days number
        const periodStr = body.period || '';
        const days = parseInt(periodStr) || parseInt(body.days) || 7;
        const analytics = await blobs.getAnalytics(days);

        // Get totals
        const orders = await blobs.getOrders();
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalProducts = await blobs.getProductCount();
        const users = await blobs.getUsers();
        const totalUsers = users.filter(u => u.role !== 'admin').length;
        const totalViews = analytics.reduce((s, d) => s + (d.views || 0), 0);
        const totalUnique = analytics.reduce((s, d) => s + (d.unique || 0), 0);

        // Page breakdown from analytics
        const pageTotals = {};
        analytics.forEach(day => {
            if (day.pages) {
                Object.entries(day.pages).forEach(([page, count]) => {
                    if (!pageTotals[page]) pageTotals[page] = { page, views: 0 };
                    pageTotals[page].views += count;
                });
            }
        });
        const pageBreakdown = Object.values(pageTotals).sort((a, b) => b.views - a.views);

        // Order status breakdown
        const orderStats = { new: 0, processing: 0, shipped: 0, completed: 0, totalRevenue, avgOrder: totalOrders ? Math.round(totalRevenue / totalOrders) : 0 };
        orders.forEach(o => { if (orderStats[o.status] !== undefined) orderStats[o.status]++; });

        // Chart data for frontend
        const chartData = analytics.slice().reverse().map(d => ({ date: d.date, views: d.views || 0, unique: d.unique || 0 }));

        return {
            statusCode: 200, headers,
            body: JSON.stringify({
                analytics,
                // Keys for overview tab
                products: totalProducts,
                orders: totalOrders,
                revenue: totalRevenue,
                users: totalUsers,
                chartData,
                // Extended stats
                totalViews,
                totalUnique,
                pageBreakdown,
                orderStats
            })
        };
    } catch (err) {
        console.error('[analytics] Error:', err.message);
        return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Server error' }) };
    }
};
