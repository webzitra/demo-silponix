// Netlify Blobs persistent storage abstraction
// Replaces in-memory store.js — data survives restarts
// Falls back to filesystem store for local dev without linked site
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let blobsImport = null;
let useFileFallback = false;

// Filesystem-based fallback store for local dev
function createFileStore(name) {
    const dir = path.join(process.cwd(), '.data', name);
    fs.mkdirSync(dir, { recursive: true });

    function keyPath(key) {
        return path.join(dir, encodeURIComponent(key) + '.json');
    }
    function binPath(key) {
        return path.join(dir, encodeURIComponent(key) + '.bin');
    }

    return {
        async get(key, opts) {
            try {
                if (opts && opts.type === 'arrayBuffer') {
                    const data = fs.readFileSync(binPath(key));
                    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                }
                const raw = fs.readFileSync(keyPath(key), 'utf8');
                if (opts && opts.type === 'json') return JSON.parse(raw);
                return raw;
            } catch (e) { return null; }
        },
        async set(key, value, opts) {
            if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
                fs.writeFileSync(binPath(key), value);
                if (opts && opts.metadata) {
                    fs.writeFileSync(keyPath(key + '__meta'), JSON.stringify(opts.metadata));
                }
            } else {
                fs.writeFileSync(keyPath(key), typeof value === 'string' ? value : JSON.stringify(value));
            }
        },
        async setJSON(key, value) {
            fs.writeFileSync(keyPath(key), JSON.stringify(value));
        },
        async delete(key) {
            try { fs.unlinkSync(keyPath(key)); } catch (e) { /* ok */ }
            try { fs.unlinkSync(binPath(key)); } catch (e) { /* ok */ }
        },
        async getMetadata(key) {
            try {
                const raw = fs.readFileSync(keyPath(key + '__meta'), 'utf8');
                return { metadata: JSON.parse(raw) };
            } catch (e) { return null; }
        },
        async list(opts) {
            try {
                const files = fs.readdirSync(dir);
                const prefix = opts && opts.prefix ? encodeURIComponent(opts.prefix) : '';
                const blobs = files
                    .filter(f => f.endsWith('.json') && !f.includes('__meta'))
                    .map(f => ({ key: decodeURIComponent(f.replace('.json', '')) }))
                    .filter(b => !prefix || encodeURIComponent(b.key).startsWith(prefix));
                return { blobs };
            } catch (e) { return { blobs: [] }; }
        }
    };
}

async function getBlobStore(name) {
    if (useFileFallback) return createFileStore(name);
    if (!blobsImport) {
        try {
            blobsImport = await import('@netlify/blobs');
            // Test if environment is configured
            const testStore = blobsImport.getStore({ name: '_test', consistency: 'strong' });
            await testStore.get('_ping');
            // If we get here, blobs work
        } catch (e) {
            if (e.message && e.message.includes('not been configured')) {
                console.log('[blobs] Netlify Blobs not available, using filesystem fallback (.data/)');
                useFileFallback = true;
                return createFileStore(name);
            }
            // Other errors during test — try blobs anyway
            if (!blobsImport) throw e;
        }
    }
    if (useFileFallback) return createFileStore(name);
    return blobsImport.getStore({ name, consistency: 'strong' });
}

// ==================== SEED ====================

let seeded = false;

async function seedIfNeeded() {
    if (seeded) return;
    seeded = true;
    try {
        const store = await getBlobStore('users');
        const existing = await store.get('user:test_admin', { type: 'json' });
        if (!existing) {
            const { hashPassword } = require('./auth-helpers');

            const admin = {
                id: 'test_admin',
                name: 'Test Admin',
                email: 'test_admin@mail.cz',
                passwordHash: hashPassword('demo123'),
                role: 'admin',
                createdAt: new Date().toISOString()
            };
            const customer = {
                id: 'test_zakaznik',
                name: 'Test Zákazník',
                email: 'test_zakaznik@mail.cz',
                passwordHash: hashPassword('demo123'),
                role: 'customer',
                createdAt: new Date().toISOString()
            };

            await saveUser(admin);
            await saveUser(customer);

            const orderStore = await getBlobStore('orders');
            await orderStore.setJSON('order-counter', { counter: 1000 });

            console.log('[blobs] Seeded test accounts');
        }

        // Seed products, media, and blog posts (independent of user seed)
        const { SEED_PRODUCTS, SEED_GALLERY, SEED_POSTS } = require('./seed-data');

        const productCount = await getProductCount();
        if (productCount === 0) {
            for (const p of SEED_PRODUCTS) {
                await saveProduct(p);
            }
            console.log('[blobs] Seeded ' + SEED_PRODUCTS.length + ' products');
        }

        const mediaList = await getMediaList();
        if (mediaList.length === 0) {
            for (const m of SEED_GALLERY) {
                m.createdAt = new Date().toISOString();
                await saveMediaMeta(m);
            }
            console.log('[blobs] Seeded ' + SEED_GALLERY.length + ' gallery images');
        }

        const posts = await getPosts();
        if (posts.length === 0) {
            for (const p of SEED_POSTS) {
                await savePost(p);
            }
            console.log('[blobs] Seeded ' + SEED_POSTS.length + ' blog posts');
        }
    } catch (err) {
        console.error('[blobs] Seed error:', err.message);
        seeded = false;
    }
}

// ==================== USERS ====================

async function findUserByEmail(email) {
    await seedIfNeeded();
    const store = await getBlobStore('users');
    const mapping = await store.get('email:' + email.toLowerCase(), { type: 'json' });
    if (!mapping) return null;
    return store.get('user:' + mapping.userId, { type: 'json' });
}

async function findUserById(userId) {
    await seedIfNeeded();
    const store = await getBlobStore('users');
    return store.get('user:' + userId, { type: 'json' });
}

async function saveUser(user) {
    const store = await getBlobStore('users');
    await store.setJSON('user:' + user.id, user);
    await store.setJSON('email:' + user.email.toLowerCase(), { userId: user.id });
    return user;
}

async function updateUser(userId, updates) {
    const user = await findUserById(userId);
    if (!user) return null;
    Object.assign(user, updates);
    await saveUser(user);
    return user;
}

async function getUsers() {
    await seedIfNeeded();
    const store = await getBlobStore('users');
    const { blobs } = await store.list({ prefix: 'user:' });
    const users = [];
    for (const blob of blobs) {
        const user = await store.get(blob.key, { type: 'json' });
        if (user) users.push(user);
    }
    return users;
}

// ==================== ORDERS ====================

async function addOrder(order) {
    const store = await getBlobStore('orders');
    const counterData = await store.get('order-counter', { type: 'json' }) || { counter: 1000 };
    counterData.counter++;
    order.id = 'SP-' + counterData.counter;
    order.createdAt = new Date().toISOString();
    order.status = order.status || 'new';
    await store.setJSON('order-counter', counterData);
    await store.setJSON('order:' + order.id, order);

    // Update user-orders index
    if (order.userId) {
        const idx = await store.get('user-orders:' + order.userId, { type: 'json' }) || [];
        idx.push(order.id);
        await store.setJSON('user-orders:' + order.userId, idx);
    }

    // Update order list
    const list = await store.get('order-list', { type: 'json' }) || [];
    list.push(order.id);
    await store.setJSON('order-list', list);

    return order;
}

async function getOrders() {
    const store = await getBlobStore('orders');
    const list = await store.get('order-list', { type: 'json' }) || [];
    const orders = [];
    for (const id of list) {
        const order = await store.get('order:' + id, { type: 'json' });
        if (order) orders.push(order);
    }
    return orders;
}

async function getOrdersByUserId(userId) {
    const store = await getBlobStore('orders');
    const idx = await store.get('user-orders:' + userId, { type: 'json' }) || [];
    const orders = [];
    for (const id of idx) {
        const order = await store.get('order:' + id, { type: 'json' });
        if (order) orders.push(order);
    }
    return orders;
}

async function updateOrderStatus(orderId, status) {
    const store = await getBlobStore('orders');
    const order = await store.get('order:' + orderId, { type: 'json' });
    if (!order) return null;
    order.status = status;
    await store.setJSON('order:' + orderId, order);
    return order;
}

// ==================== PRODUCTS ====================

async function getProducts() {
    const store = await getBlobStore('products');
    const list = await store.get('product-list', { type: 'json' }) || [];
    const products = [];
    for (const id of list) {
        const p = await store.get('product:' + id, { type: 'json' });
        if (p) products.push(p);
    }
    return products;
}

async function getProduct(id) {
    const store = await getBlobStore('products');
    return store.get('product:' + id, { type: 'json' });
}

async function saveProduct(product) {
    const store = await getBlobStore('products');
    await store.setJSON('product:' + product.id, product);

    // Update product list if not present
    const list = await store.get('product-list', { type: 'json' }) || [];
    if (!list.includes(product.id)) {
        list.push(product.id);
        await store.setJSON('product-list', list);
    }
    return product;
}

async function deleteProduct(id) {
    const store = await getBlobStore('products');
    await store.delete('product:' + id);
    const list = await store.get('product-list', { type: 'json' }) || [];
    const idx = list.indexOf(id);
    if (idx !== -1) {
        list.splice(idx, 1);
        await store.setJSON('product-list', list);
    }
}

async function getProductCount() {
    const store = await getBlobStore('products');
    const list = await store.get('product-list', { type: 'json' }) || [];
    return list.length;
}

// ==================== POSTS ====================

async function getPosts(publishedOnly) {
    const store = await getBlobStore('posts');
    const list = await store.get('post-list', { type: 'json' }) || [];
    const posts = [];
    for (const entry of list) {
        if (publishedOnly && !entry.published) continue;
        const p = await store.get('post:' + entry.slug, { type: 'json' });
        if (p) posts.push(p);
    }
    return posts;
}

async function getPost(slug) {
    const store = await getBlobStore('posts');
    return store.get('post:' + slug, { type: 'json' });
}

async function savePost(post) {
    const store = await getBlobStore('posts');
    await store.setJSON('post:' + post.slug, post);

    // Update post list
    const list = await store.get('post-list', { type: 'json' }) || [];
    const existing = list.findIndex(e => e.slug === post.slug);
    const entry = { slug: post.slug, date: post.date, published: post.published || false };
    if (existing >= 0) {
        list[existing] = entry;
    } else {
        list.unshift(entry); // newest first
    }
    await store.setJSON('post-list', list);
    return post;
}

async function deletePost(slug) {
    const store = await getBlobStore('posts');
    await store.delete('post:' + slug);
    const list = await store.get('post-list', { type: 'json' }) || [];
    const idx = list.findIndex(e => e.slug === slug);
    if (idx !== -1) {
        list.splice(idx, 1);
        await store.setJSON('post-list', list);
    }
}

// ==================== MEDIA ====================

async function saveMedia(id, buffer, contentType) {
    const store = await getBlobStore('media');
    await store.set('file:' + id, buffer, { metadata: { contentType } });
}

async function getMedia(id) {
    const store = await getBlobStore('media');
    const data = await store.get('file:' + id, { type: 'arrayBuffer' });
    if (!data) return null;
    const meta = await store.getMetadata('file:' + id);
    return { data: Buffer.from(data), contentType: (meta && meta.metadata && meta.metadata.contentType) || 'application/octet-stream' };
}

async function saveMediaMeta(meta) {
    const store = await getBlobStore('media');
    await store.setJSON('meta:' + meta.id, meta);

    const list = await store.get('media-list', { type: 'json' }) || [];
    const existing = list.findIndex(e => e.id === meta.id);
    if (existing >= 0) {
        list[existing] = meta;
    } else {
        list.unshift(meta);
    }
    await store.setJSON('media-list', list);
    return meta;
}

async function getMediaMeta(id) {
    const store = await getBlobStore('media');
    return store.get('meta:' + id, { type: 'json' });
}

async function getMediaList(filter) {
    const store = await getBlobStore('media');
    const list = await store.get('media-list', { type: 'json' }) || [];
    if (!filter) return list;
    return list.filter(m => {
        if (filter.tag && (!m.tags || !m.tags.includes(filter.tag))) return false;
        if (filter.type && m.type !== filter.type) return false;
        return true;
    });
}

async function deleteMedia(id) {
    const store = await getBlobStore('media');
    await store.delete('file:' + id);
    await store.delete('meta:' + id);
    const list = await store.get('media-list', { type: 'json' }) || [];
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) {
        list.splice(idx, 1);
        await store.setJSON('media-list', list);
    }
}

async function updateMediaTags(id, tags) {
    const meta = await getMediaMeta(id);
    if (!meta) return null;
    meta.tags = tags;
    return saveMediaMeta(meta);
}

// ==================== ANALYTICS ====================

async function trackPageView(page, ip) {
    const store = await getBlobStore('analytics');
    const date = new Date().toISOString().split('T')[0];
    const key = 'pv:' + date + ':' + page.replace(/\//g, '_');

    const data = await store.get(key, { type: 'json' }) || { count: 0, ips: [] };
    data.count++;
    const isUnique = !data.ips.includes(ip);
    if (isUnique && data.ips.length < 10000) data.ips.push(ip);
    await store.setJSON(key, data);

    // Update daily summary
    const summaryKey = 'summary:' + date;
    const summary = await store.get(summaryKey, { type: 'json' }) || { views: 0, unique: 0, pages: {} };
    summary.views++;
    if (isUnique) summary.unique++;
    summary.pages[page] = (summary.pages[page] || 0) + 1;
    await store.setJSON(summaryKey, summary);
}

async function getAnalytics(days) {
    const store = await getBlobStore('analytics');
    const result = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const date = d.toISOString().split('T')[0];
        const summary = await store.get('summary:' + date, { type: 'json' }) || { views: 0, unique: 0, pages: {} };
        result.push({ date, ...summary });
    }
    return result;
}

// ==================== SETTINGS ====================

async function getSettings() {
    const store = await getBlobStore('settings');
    return await store.get('shop', { type: 'json' }) || {
        name: 'Silponix',
        currency: 'CZK',
        freeShippingThreshold: 20000,
        email: 'info@silponix.cz',
        phone: '+420 777 123 456',
        shippingCost: 149,
        codFee: 49
    };
}

async function saveSettings(settings) {
    const store = await getBlobStore('settings');
    await store.setJSON('shop', settings);
    return settings;
}

async function getCompanyInfo() {
    const store = await getBlobStore('settings');
    return await store.get('company', { type: 'json' }) || {};
}

async function saveCompanyInfo(info) {
    const store = await getBlobStore('settings');
    await store.setJSON('company', info);
    return info;
}

// ==================== RESET TOKENS ====================

async function saveResetToken(token, data) {
    const store = await getBlobStore('users');
    await store.setJSON('reset:' + token, data);
}

async function getResetToken(token) {
    const store = await getBlobStore('users');
    return store.get('reset:' + token, { type: 'json' });
}

async function deleteResetToken(token) {
    const store = await getBlobStore('users');
    await store.delete('reset:' + token);
}

// ==================== USER MANAGEMENT ====================

async function changeUserEmail(userId, oldEmail, newEmail) {
    const store = await getBlobStore('users');
    const user = await store.get('user:' + userId, { type: 'json' });
    if (!user) return null;
    // Delete old email index
    await store.delete('email:' + oldEmail.toLowerCase());
    // Update user
    user.email = newEmail;
    await store.setJSON('user:' + userId, user);
    // Create new email index
    await store.setJSON('email:' + newEmail.toLowerCase(), { userId: userId });
    return user;
}

async function deleteUser(userId, email) {
    const store = await getBlobStore('users');
    await store.delete('user:' + userId);
    if (email) await store.delete('email:' + email.toLowerCase());
    // Also remove newsletter subscription
    const nlStore = await getBlobStore('newsletters');
    if (email) await nlStore.delete('sub:' + email.toLowerCase());
}

// ==================== NEWSLETTER ====================

async function saveNewsletter(email) {
    const store = await getBlobStore('newsletters');
    await store.setJSON('sub:' + email.toLowerCase(), { email: email.toLowerCase(), subscribedAt: new Date().toISOString() });
    // Update list
    const list = await store.get('subscriber-list', { type: 'json' }) || [];
    if (!list.includes(email.toLowerCase())) {
        list.push(email.toLowerCase());
        await store.setJSON('subscriber-list', list);
    }
}

async function getNewsletters() {
    const store = await getBlobStore('newsletters');
    const list = await store.get('subscriber-list', { type: 'json' }) || [];
    const subscribers = [];
    for (const email of list) {
        const sub = await store.get('sub:' + email, { type: 'json' });
        if (sub) subscribers.push(sub);
    }
    return subscribers;
}

async function deleteNewsletter(email) {
    const store = await getBlobStore('newsletters');
    await store.delete('sub:' + email.toLowerCase());
    const list = await store.get('subscriber-list', { type: 'json' }) || [];
    const idx = list.indexOf(email.toLowerCase());
    if (idx !== -1) {
        list.splice(idx, 1);
        await store.setJSON('subscriber-list', list);
    }
}

async function isSubscribed(email) {
    const store = await getBlobStore('newsletters');
    const sub = await store.get('sub:' + email.toLowerCase(), { type: 'json' });
    return !!sub;
}

// ==================== NEWSLETTER DRAFTS & HISTORY ====================

async function saveNewsletterDraft(draft) {
    const store = await getBlobStore('newsletters');
    await store.setJSON('newsletter-draft:' + draft.id, draft);
    const list = await store.get('newsletter-draft-list', { type: 'json' }) || [];
    if (!list.includes(draft.id)) {
        list.push(draft.id);
        await store.setJSON('newsletter-draft-list', list);
    }
}

async function getNewsletterDrafts() {
    const store = await getBlobStore('newsletters');
    const list = await store.get('newsletter-draft-list', { type: 'json' }) || [];
    const drafts = [];
    for (const id of list) {
        const d = await store.get('newsletter-draft:' + id, { type: 'json' });
        if (d) drafts.push(d);
    }
    return drafts;
}

async function getNewsletterDraft(id) {
    const store = await getBlobStore('newsletters');
    return await store.get('newsletter-draft:' + id, { type: 'json' });
}

async function deleteNewsletterDraft(id) {
    const store = await getBlobStore('newsletters');
    await store.delete('newsletter-draft:' + id);
    const list = await store.get('newsletter-draft-list', { type: 'json' }) || [];
    const idx = list.indexOf(id);
    if (idx !== -1) {
        list.splice(idx, 1);
        await store.setJSON('newsletter-draft-list', list);
    }
}

async function saveNewsletterSent(record) {
    const store = await getBlobStore('newsletters');
    await store.setJSON('newsletter-sent:' + record.id, record);
    const list = await store.get('newsletter-sent-list', { type: 'json' }) || [];
    list.push(record.id);
    await store.setJSON('newsletter-sent-list', list);
}

async function getNewsletterHistory() {
    const store = await getBlobStore('newsletters');
    const list = await store.get('newsletter-sent-list', { type: 'json' }) || [];
    const history = [];
    for (const id of list) {
        const r = await store.get('newsletter-sent:' + id, { type: 'json' });
        if (r) history.push(r);
    }
    return history.reverse();
}

async function getNewsletterSent(id) {
    const store = await getBlobStore('newsletters');
    return await store.get('newsletter-sent:' + id, { type: 'json' });
}

// ==================== MESSAGES ====================

async function saveMessage(msg) {
    const store = await getBlobStore('messages');
    await store.setJSON('msg:' + msg.id, msg);
    const list = await store.get('message-list', { type: 'json' }) || [];
    list.unshift(msg.id);
    await store.setJSON('message-list', list);
    return msg;
}

async function getMessages() {
    const store = await getBlobStore('messages');
    const list = await store.get('message-list', { type: 'json' }) || [];
    const messages = [];
    for (const id of list) {
        const m = await store.get('msg:' + id, { type: 'json' });
        if (m) messages.push(m);
    }
    return messages;
}

async function deleteMessage(id) {
    const store = await getBlobStore('messages');
    await store.delete('msg:' + id);
    const list = await store.get('message-list', { type: 'json' }) || [];
    const idx = list.indexOf(id);
    if (idx !== -1) {
        list.splice(idx, 1);
        await store.setJSON('message-list', list);
    }
}

module.exports = {
    // Users
    findUserByEmail, findUserById, saveUser, updateUser, getUsers,
    changeUserEmail, deleteUser,
    // Orders
    addOrder, getOrders, getOrdersByUserId, updateOrderStatus,
    // Products
    getProducts, getProduct, saveProduct, deleteProduct, getProductCount,
    // Posts
    getPosts, getPost, savePost, deletePost,
    // Media
    saveMedia, getMedia, saveMediaMeta, getMediaMeta, getMediaList, deleteMedia, updateMediaTags,
    // Analytics
    trackPageView, getAnalytics,
    // Settings
    getSettings, saveSettings, getCompanyInfo, saveCompanyInfo,
    // Newsletter subscribers
    saveNewsletter, getNewsletters, deleteNewsletter, isSubscribed,
    // Newsletter drafts & history
    saveNewsletterDraft, getNewsletterDrafts, getNewsletterDraft, deleteNewsletterDraft,
    saveNewsletterSent, getNewsletterHistory, getNewsletterSent,
    // Messages
    saveMessage, getMessages, deleteMessage,
    // Reset tokens
    saveResetToken, getResetToken, deleteResetToken,
    // Seed
    seedIfNeeded
};
