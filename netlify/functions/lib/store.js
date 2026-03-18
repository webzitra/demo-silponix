const crypto = require('crypto');

// Pre-seed test accounts at module load time
function seedHash(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return salt + ':' + hash;
}

// In-memory store — resets on cold start. For production, use Netlify Blobs or a database.
const store = {
    users: [
        {
            id: 'test_zakaznik',
            name: 'Test Zákazník',
            email: 'test_zakaznik@mail.cz',
            passwordHash: seedHash('demo123'),
            createdAt: new Date().toISOString()
        },
        {
            id: 'test_admin',
            name: 'Test Admin',
            email: 'test_admin@mail.cz',
            passwordHash: seedHash('demo123'),
            role: 'admin',
            createdAt: new Date().toISOString()
        }
    ],
    orders: [],
    orderCounter: 1000
};

function getUsers() { return store.users; }
function findUserByEmail(email) { return store.users.find(u => u.email === email.toLowerCase()); }
function findUserById(id) { return store.users.find(u => u.id === id); }
function addUser(user) { store.users.push(user); return user; }
function updateUser(id, updates) {
    const user = findUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
}

function getOrders() { return store.orders; }
function getOrdersByUserId(userId) { return store.orders.filter(o => o.userId === userId); }
function addOrder(order) {
    order.id = 'SP-' + (++store.orderCounter);
    order.createdAt = new Date().toISOString();
    order.status = order.status || 'new';
    store.orders.push(order);
    return order;
}
function updateOrderStatus(orderId, status) {
    const order = store.orders.find(o => o.id === orderId);
    if (!order) return null;
    order.status = status;
    return order;
}

module.exports = { getUsers, findUserByEmail, findUserById, addUser, updateUser, getOrders, getOrdersByUserId, addOrder, updateOrderStatus };
