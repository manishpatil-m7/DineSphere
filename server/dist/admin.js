"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
exports.logAdminAction = logAdminAction;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-before-deploy';
if (process.env.CLOUDINARY_URL) {
    cloudinary_1.v2.config({
        secure: true
    });
}
// -------------------------------------------------------------
// Uploads Setup
// -------------------------------------------------------------
const uploadDir = path_1.default.join(__dirname, '../uploads/dishes');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const uniqueName = `dish_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPG, PNG, and WebP images are allowed (max 2 MB)'));
        }
    }
});
// -------------------------------------------------------------
// Middleware: require_admin
// -------------------------------------------------------------
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
        }
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
            return res.status(403).json({ success: false, message: 'Access forbidden: Administrator permissions required.' });
        }
        req.user = user;
        next();
    });
};
exports.requireAdmin = requireAdmin;
router.use(exports.requireAdmin);
// -------------------------------------------------------------
// Helper: Log Admin Actions
// -------------------------------------------------------------
async function logAdminAction(action, entity, entityId, details) {
    try {
        await prisma.adminAction.create({
            data: {
                action,
                entity,
                entity_id: entityId ? String(entityId) : null,
                details: typeof details === 'string' ? details : JSON.stringify(details || {})
            }
        });
    }
    catch (err) {
        console.error('Failed to log admin action:', err);
    }
}
// -------------------------------------------------------------
// Helper: CSV Injection Protection
// -------------------------------------------------------------
function sanitizeCsvCell(val) {
    if (val === null || val === undefined)
        return '""';
    let str = String(val).trim();
    if (['=', '+', '-', '@'].includes(str.charAt(0))) {
        str = "'" + str;
    }
    return `"${str.replace(/"/g, '""')}"`;
}
// Helper: Date range filter
function parseRange(range, from, to) {
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();
    if (from && to) {
        startDate = new Date(from);
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        const duration = endDate.getTime() - startDate.getTime();
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - duration);
        return { startDate, endDate, prevStartDate, prevEndDate };
    }
    if (range === 'today') {
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(now);
        prevStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
        prevEndDate = new Date(startDate.getTime() - 1);
        return { startDate, endDate, prevStartDate, prevEndDate };
    }
    if (range === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const endDate = new Date(now);
        prevEndDate = new Date(startDate.getTime() - 1);
        prevStartDate = new Date(prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { startDate, endDate, prevStartDate, prevEndDate };
    }
    // Default 30d
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(now);
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate, endDate, prevStartDate, prevEndDate };
}
// =============================================================
// 1. DASHBOARD & REPORTS ENDPOINTS
// =============================================================
router.get('/dashboard/summary', async (req, res) => {
    try {
        const { range, from, to } = req.query;
        const { startDate, endDate, prevStartDate, prevEndDate } = parseRange(range, from, to);
        // Current period orders
        const orders = await prisma.customerOrder.findMany({
            where: { created_at: { gte: startDate, lte: endDate } }
        });
        // Previous period orders
        const prevOrders = await prisma.customerOrder.findMany({
            where: { created_at: { gte: prevStartDate, lte: prevEndDate } }
        });
        const activeOrders = orders.filter(o => o.status !== 'Cancelled');
        const prevActiveOrders = prevOrders.filter(o => o.status !== 'Cancelled');
        const revenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
        const prevRevenue = prevActiveOrders.reduce((sum, o) => sum + o.total, 0);
        const ordersCount = orders.length;
        const prevOrdersCount = prevOrders.length;
        const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;
        const prevCancelledCount = prevOrders.filter(o => o.status === 'Cancelled').length;
        const aov = activeOrders.length > 0 ? Math.round(revenue / activeOrders.length) : 0;
        const prevAov = prevActiveOrders.length > 0 ? Math.round(prevRevenue / prevActiveOrders.length) : 0;
        // Reservations
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        const prevStartStr = prevStartDate.toISOString().split('T')[0];
        const prevEndStr = prevEndDate.toISOString().split('T')[0];
        const reservationsCount = await prisma.cinemaReservation.count({
            where: { date: { gte: startStr, lte: endStr }, status: { not: 'Cancelled' } }
        });
        const prevReservationsCount = await prisma.cinemaReservation.count({
            where: { date: { gte: prevStartStr, lte: prevEndStr }, status: { not: 'Cancelled' } }
        });
        // Customers
        const newCustomers = await prisma.user.count({
            where: { role: 'CUSTOMER', createdAt: { gte: startDate, lte: endDate } }
        });
        const prevNewCustomers = await prisma.user.count({
            where: { role: 'CUSTOMER', createdAt: { gte: prevStartDate, lte: prevEndDate } }
        });
        const calcDelta = (cur, prev) => {
            if (prev === 0)
                return cur > 0 ? '+100%' : '0%';
            const pct = Math.round(((cur - prev) / prev) * 100);
            return (pct >= 0 ? '+' : '') + pct + '%';
        };
        const settings = await prisma.restaurantSetting.findFirst();
        res.json({
            success: true,
            data: {
                revenue: { value: revenue, delta: calcDelta(revenue, prevRevenue) },
                orders: { value: ordersCount, delta: calcDelta(ordersCount, prevOrdersCount) },
                aov: { value: aov, delta: calcDelta(aov, prevAov) },
                reservations: { value: reservationsCount, delta: calcDelta(reservationsCount, prevReservationsCount) },
                newCustomers: { value: newCustomers, delta: calcDelta(newCustomers, prevNewCustomers) },
                cancelledOrders: { value: cancelledCount, delta: calcDelta(cancelledCount, prevCancelledCount) },
                is_accepting_orders: settings ? settings.is_accepting_orders : true
            }
        });
    }
    catch (err) {
        console.error('Dashboard summary error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
    }
});
router.get('/reports/revenue-by-day', async (req, res) => {
    try {
        const { range, from, to } = req.query;
        const { startDate, endDate } = parseRange(range, from, to);
        const orders = await prisma.customerOrder.findMany({
            where: { created_at: { gte: startDate, lte: endDate }, status: { not: 'Cancelled' } },
            orderBy: { created_at: 'asc' }
        });
        const dayMap = {};
        for (const o of orders) {
            const d = o.created_at.toISOString().split('T')[0];
            if (!dayMap[d])
                dayMap[d] = { date: d, revenue: 0, orders: 0 };
            dayMap[d].revenue += o.total;
            dayMap[d].orders += 1;
        }
        res.json({ success: true, data: Object.values(dayMap) });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch revenue report' });
    }
});
router.get('/reports/orders-by-status', async (req, res) => {
    try {
        const { range, from, to } = req.query;
        const { startDate, endDate } = parseRange(range, from, to);
        const orders = await prisma.customerOrder.findMany({
            where: { created_at: { gte: startDate, lte: endDate } }
        });
        const counts = { Placed: 0, Preparing: 0, Ready: 0, Served: 0, Cancelled: 0 };
        for (const o of orders) {
            counts[o.status] = (counts[o.status] || 0) + 1;
        }
        const data = Object.entries(counts).map(([status, count]) => ({ status, count }));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders by status' });
    }
});
router.get('/reports/top-dishes', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const { range, from, to } = req.query;
        const { startDate, endDate } = parseRange(range, from, to);
        const orderItems = await prisma.customerOrderItem.findMany({
            where: {
                order: {
                    created_at: { gte: startDate, lte: endDate },
                    status: { not: 'Cancelled' }
                }
            }
        });
        const dishCounts = {};
        for (const it of orderItems) {
            if (!dishCounts[it.name]) {
                dishCounts[it.name] = { name: it.name, quantity: 0, revenue: 0 };
            }
            dishCounts[it.name].quantity += it.quantity;
            dishCounts[it.name].revenue += it.price * it.quantity;
        }
        const sorted = Object.values(dishCounts)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, limit);
        res.json({ success: true, data: sorted });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch top dishes' });
    }
});
router.get('/reports/orders-by-hour', async (req, res) => {
    try {
        const { range, from, to } = req.query;
        const { startDate, endDate } = parseRange(range, from, to);
        const orders = await prisma.customerOrder.findMany({
            where: { created_at: { gte: startDate, lte: endDate } }
        });
        const hours = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i.toString().padStart(2, '0')}:00`,
            orders: 0
        }));
        for (const o of orders) {
            const h = new Date(o.created_at).getHours();
            hours[h].orders += 1;
        }
        res.json({ success: true, data: hours.slice(10, 24) }); // Typical restaurant hours
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders by hour' });
    }
});
router.get('/reports/order-type-split', async (req, res) => {
    try {
        const { range, from, to } = req.query;
        const { startDate, endDate } = parseRange(range, from, to);
        const orders = await prisma.customerOrder.findMany({
            where: { created_at: { gte: startDate, lte: endDate } }
        });
        const counts = { 'Dine-in': 0, 'Takeaway': 0, 'Delivery': 0 };
        for (const o of orders) {
            counts[o.order_type] = (counts[o.order_type] || 0) + 1;
        }
        const data = Object.entries(counts).map(([type, count]) => ({ type, count }));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch order type split' });
    }
});
router.get('/reports/category-revenue', async (req, res) => {
    try {
        const { range, from, to } = req.query;
        const { startDate, endDate } = parseRange(range, from, to);
        const dishes = await prisma.dish.findMany();
        const dishCategoryMap = new Map(dishes.map(d => [d.name, d.category]));
        const orderItems = await prisma.customerOrderItem.findMany({
            where: {
                order: {
                    created_at: { gte: startDate, lte: endDate },
                    status: { not: 'Cancelled' }
                }
            }
        });
        const catRev = { 'Starters': 0, 'Main Course': 0, 'Desserts': 0, 'Drinks': 0 };
        for (const it of orderItems) {
            const cat = dishCategoryMap.get(it.name) || 'Main Course';
            catRev[cat] = (catRev[cat] || 0) + it.price * it.quantity;
        }
        const data = Object.entries(catRev).map(([category, revenue]) => ({ category, revenue }));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch category revenue' });
    }
});
router.get('/reports/reservations-by-slot', async (req, res) => {
    try {
        const { range, from, to } = req.query;
        const { startDate, endDate } = parseRange(range, from, to);
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        const reservations = await prisma.cinemaReservation.findMany({
            where: { date: { gte: startStr, lte: endStr }, status: { not: 'Cancelled' } }
        });
        const slotCounts = {};
        for (const r of reservations) {
            slotCounts[r.time_slot] = (slotCounts[r.time_slot] || 0) + 1;
        }
        const data = Object.entries(slotCounts).map(([slot, count]) => ({ slot, count }));
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch reservations by slot' });
    }
});
router.get('/reports/customer-growth', async (req, res) => {
    try {
        const { range, from, to } = req.query;
        const { startDate, endDate } = parseRange(range, from, to);
        const customers = await prisma.user.findMany({
            where: { role: 'CUSTOMER', createdAt: { gte: startDate, lte: endDate } },
            orderBy: { createdAt: 'asc' }
        });
        const dayCounts = {};
        for (const c of customers) {
            const d = c.createdAt.toISOString().split('T')[0];
            dayCounts[d] = (dayCounts[d] || 0) + 1;
        }
        let cumulative = 0;
        const data = Object.entries(dayCounts).map(([date, count]) => {
            cumulative += count;
            return { date, newCustomers: count, total: cumulative };
        });
        res.json({ success: true, data });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch customer growth' });
    }
});
// CSV Export Endpoint with injection protection
router.get('/reports/export.csv', async (req, res) => {
    try {
        const { type, from, to } = req.query;
        const { startDate, endDate } = parseRange(undefined, from, to);
        let csvContent = '';
        let filename = 'export.csv';
        if (type === 'orders') {
            filename = `orders_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`;
            const orders = await prisma.customerOrder.findMany({
                where: { created_at: { gte: startDate, lte: endDate } },
                include: { items: true },
                orderBy: { created_at: 'desc' }
            });
            const headers = ['Order ID', 'Date', 'Type', 'Status', 'Table', 'Subtotal', 'Discount', 'Total', 'Payment Method', 'Items Count'];
            csvContent += headers.map(sanitizeCsvCell).join(',') + '\n';
            for (const o of orders) {
                const row = [
                    o.id,
                    o.created_at.toISOString(),
                    o.order_type,
                    o.status,
                    o.table_number || 'N/A',
                    o.subtotal,
                    o.discount,
                    o.total,
                    o.payment_method,
                    o.items.length
                ];
                csvContent += row.map(sanitizeCsvCell).join(',') + '\n';
            }
        }
        else if (type === 'customers') {
            filename = `customers_${new Date().toISOString().split('T')[0]}.csv`;
            const customers = await prisma.user.findMany({
                where: { role: 'CUSTOMER' },
                orderBy: { createdAt: 'desc' }
            });
            const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Points', 'Active', 'Joined Date'];
            csvContent += headers.map(sanitizeCsvCell).join(',') + '\n';
            for (const c of customers) {
                const row = [
                    c.id,
                    c.name,
                    c.email,
                    c.phone || '',
                    c.points,
                    c.is_active ? 'Yes' : 'No',
                    c.createdAt.toISOString()
                ];
                csvContent += row.map(sanitizeCsvCell).join(',') + '\n';
            }
        }
        else if (type === 'reservations') {
            filename = `reservations_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`;
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            const reservations = await prisma.cinemaReservation.findMany({
                where: { date: { gte: startStr, lte: endStr } },
                include: { tables: true },
                orderBy: { date: 'desc' }
            });
            const headers = ['Reservation Code', 'Date', 'Time Slot', 'Guests', 'Status', 'Source', 'Tables', 'Fee Total', 'Guest Name'];
            csvContent += headers.map(sanitizeCsvCell).join(',') + '\n';
            for (const r of reservations) {
                const row = [
                    r.code,
                    r.date,
                    r.time_slot,
                    r.guests,
                    r.status,
                    r.source,
                    r.tables.map(t => t.table_label).join(' '),
                    r.fee_total,
                    r.guest_name || 'Registered User'
                ];
                csvContent += row.map(sanitizeCsvCell).join(',') + '\n';
            }
        }
        else {
            return res.status(400).send('Invalid export type specified.');
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
    }
    catch (err) {
        console.error('CSV export error:', err);
        res.status(500).send('Export generation failed.');
    }
});
// Alerts Bell Endpoint
router.get('/alerts', async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [newOrders, lowStockItems, openTickets, todaysReservations] = await Promise.all([
            prisma.customerOrder.count({ where: { status: 'Placed' } }),
            prisma.inventoryItem.findMany({
                where: {
                    OR: [
                        { quantity: { lte: 5 } }
                    ]
                },
                select: { id: true, name: true, quantity: true, low_threshold: true, unit: true }
            }),
            prisma.supportTicket.count({ where: { status: 'Open' } }),
            prisma.cinemaReservation.count({
                where: { date: todayStr, status: { in: ['Confirmed', 'Seated'] } }
            })
        ]);
        // Filter items where quantity <= low_threshold
        const actualLowStock = lowStockItems.filter(item => item.quantity <= item.low_threshold);
        res.json({
            success: true,
            data: {
                new_orders: newOrders,
                low_stock: actualLowStock.length,
                low_stock_items: actualLowStock,
                open_tickets: openTickets,
                todays_reservations: todaysReservations
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
    }
});
// Global Search
router.get('/search', async (req, res) => {
    try {
        const query = String(req.query.q || '').trim();
        if (!query) {
            return res.json({ success: true, data: { orders: [], customers: [], reservations: [] } });
        }
        const [orders, customers, reservations] = await Promise.all([
            prisma.customerOrder.findMany({
                where: {
                    OR: [
                        { id: { contains: query } },
                        { notes: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, status: true, total: true, order_type: true, created_at: true }
            }),
            prisma.user.findMany({
                where: {
                    role: 'CUSTOMER',
                    OR: [
                        { name: { contains: query } },
                        { email: { contains: query } },
                        { phone: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, name: true, email: true, phone: true, points: true }
            }),
            prisma.cinemaReservation.findMany({
                where: {
                    OR: [
                        { code: { contains: query } },
                        { guest_name: { contains: query } },
                        { guest_phone: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, code: true, date: true, time_slot: true, guests: true, status: true }
            })
        ]);
        res.json({
            success: true,
            data: { orders, customers, reservations }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Search failed' });
    }
});
// =============================================================
// 2. ORDERS & KITCHEN ENDPOINTS
// =============================================================
router.get('/orders', async (req, res) => {
    try {
        const { status, type, search, from, to, page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.max(1, Math.min(100, parseInt(limit)));
        const where = {};
        if (status && status !== 'All')
            where.status = status;
        if (type && type !== 'All')
            where.order_type = type;
        if (search) {
            where.OR = [
                { id: { contains: search } },
                { address: { contains: search } },
                { notes: { contains: search } }
            ];
        }
        if (from || to) {
            where.created_at = {};
            if (from)
                where.created_at.gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                where.created_at.lte = toDate;
            }
        }
        const [total, orders] = await Promise.all([
            prisma.customerOrder.count({ where }),
            prisma.customerOrder.findMany({
                where,
                include: { items: true },
                orderBy: { created_at: 'desc' },
                skip: (pageNum - 1) * pageSize,
                take: pageSize
            })
        ]);
        // Populate customer info
        const userIds = Array.from(new Set(orders.map(o => o.user_id)));
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, phone: true }
        });
        const userMap = new Map(users.map(u => [u.id, u]));
        const enriched = orders.map(o => ({
            ...o,
            customer: userMap.get(o.user_id) || { name: 'Customer', email: '', phone: '' }
        }));
        res.json({
            success: true,
            data: {
                orders: enriched,
                pagination: {
                    total,
                    page: pageNum,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});
router.get('/orders/:id', async (req, res) => {
    try {
        const order = await prisma.customerOrder.findUnique({
            where: { id: req.params.id },
            include: { items: true }
        });
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });
        const customer = await prisma.user.findUnique({
            where: { id: order.user_id },
            select: { id: true, name: true, email: true, phone: true, points: true }
        });
        res.json({
            success: true,
            data: {
                ...order,
                customer: customer || { name: 'Guest', email: '', phone: '' }
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch order details' });
    }
});
// Update Order Status (Deduct inventory on Preparing, set status_changed_by_admin)
router.patch('/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['Placed', 'Preparing', 'Ready', 'Served', 'Cancelled'];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided' });
        }
        const order = await prisma.customerOrder.findUnique({
            where: { id: req.params.id },
            include: { items: true }
        });
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.status === 'Served' && status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Cannot cancel an order that has already been served' });
        }
        await prisma.$transaction(async (tx) => {
            // If advancing to Preparing, deduct ingredients from inventory
            if (status === 'Preparing' && order.status !== 'Preparing') {
                for (const item of order.items) {
                    const ingredients = await tx.dishIngredient.findMany({
                        where: { dish_id: item.dish_id }
                    });
                    for (const ing of ingredients) {
                        const neededQty = ing.qty_per_dish * item.quantity;
                        const invItem = await tx.inventoryItem.findUnique({ where: { id: ing.item_id } });
                        if (invItem) {
                            const newQty = Math.max(0, invItem.quantity - neededQty);
                            await tx.inventoryItem.update({
                                where: { id: invItem.id },
                                data: { quantity: newQty }
                            });
                        }
                    }
                }
            }
            await tx.customerOrder.update({
                where: { id: order.id },
                data: {
                    status,
                    status_changed_by_admin: true
                }
            });
            // Send notification to customer
            await tx.customerNotification.create({
                data: {
                    user_id: order.user_id,
                    title: `Order Update: #${order.id.slice(0, 8)} is ${status}`,
                    message: `Your DineSphere order #${order.id.slice(0, 8)} is now marked as ${status}.`
                }
            });
        });
        await logAdminAction('STATUS_CHANGE', 'Order', order.id, { from: order.status, to: status });
        const updated = await prisma.customerOrder.findUnique({
            where: { id: order.id },
            include: { items: true }
        });
        res.json({ success: true, data: updated, message: `Order status updated to ${status}` });
    }
    catch (err) {
        console.error('Order status update error:', err);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
});
router.post('/orders/:id/cancel', async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
        }
        const order = await prisma.customerOrder.findUnique({ where: { id: req.params.id } });
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.status === 'Served') {
            return res.status(400).json({ success: false, message: 'Cannot cancel an order that has already been served' });
        }
        await prisma.customerOrder.update({
            where: { id: order.id },
            data: {
                status: 'Cancelled',
                cancel_reason: reason.trim(),
                status_changed_by_admin: true
            }
        });
        await prisma.customerNotification.create({
            data: {
                user_id: order.user_id,
                title: `Order #${order.id.slice(0, 8)} Cancelled`,
                message: `Your order was cancelled by the restaurant: "${reason.trim()}". Any payment will be refunded immediately.`
            }
        });
        await logAdminAction('CANCEL', 'Order', order.id, { reason: reason.trim() });
        res.json({ success: true, message: 'Order cancelled successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to cancel order' });
    }
});
router.patch('/orders/:id/notes', async (req, res) => {
    try {
        const { notes } = req.body;
        await prisma.customerOrder.update({
            where: { id: req.params.id },
            data: { admin_notes: notes }
        });
        await logAdminAction('UPDATE_NOTES', 'Order', req.params.id, { notes });
        res.json({ success: true, message: 'Admin notes saved' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update admin notes' });
    }
});
// Kitchen Order Ticket (KOT)
router.get('/orders/:id/ticket', async (req, res) => {
    try {
        const order = await prisma.customerOrder.findUnique({
            where: { id: req.params.id },
            include: { items: true }
        });
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });
        res.json({
            success: true,
            data: {
                orderId: order.id,
                orderType: order.order_type,
                tableNumber: order.table_number,
                createdAt: order.created_at,
                notes: order.notes,
                items: order.items.map(it => ({
                    name: it.name,
                    quantity: it.quantity,
                    note: it.note
                }))
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
    }
});
// Order Invoice
router.get('/orders/:id/invoice', async (req, res) => {
    try {
        const order = await prisma.customerOrder.findUnique({
            where: { id: req.params.id },
            include: { items: true }
        });
        if (!order)
            return res.status(404).json({ success: false, message: 'Order not found' });
        const [customer, settings] = await Promise.all([
            prisma.user.findUnique({ where: { id: order.user_id } }),
            prisma.restaurantSetting.findFirst()
        ]);
        res.json({
            success: true,
            data: {
                order,
                customer: customer || { name: 'Customer', email: '', phone: '' },
                restaurant: settings || {
                    restaurant_name: 'DineSphere Luxury Dining',
                    phone: '+91 98765 43210',
                    address: 'Palms Boulevard, Mumbai'
                }
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
    }
});
// Kitchen Display System active tickets
router.get('/kitchen/tickets', async (req, res) => {
    try {
        const activeOrders = await prisma.customerOrder.findMany({
            where: { status: { in: ['Placed', 'Preparing'] } },
            include: { items: true },
            orderBy: { created_at: 'asc' } // Oldest first
        });
        const now = Date.now();
        const tickets = activeOrders.map(o => {
            const ageMinutes = Math.floor((now - new Date(o.created_at).getTime()) / 60000);
            return {
                id: o.id,
                status: o.status,
                order_type: o.order_type,
                table_number: o.table_number,
                notes: o.notes,
                created_at: o.created_at,
                age_minutes: ageMinutes,
                items: o.items.map(it => ({
                    name: it.name,
                    quantity: it.quantity,
                    note: it.note
                }))
            };
        });
        res.json({ success: true, data: tickets });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch kitchen tickets' });
    }
});
// Toggle Accepting Orders
router.patch('/settings/accepting-orders', async (req, res) => {
    try {
        const { value } = req.body;
        let settings = await prisma.restaurantSetting.findFirst();
        if (!settings) {
            settings = await prisma.restaurantSetting.create({
                data: { is_accepting_orders: !!value }
            });
        }
        else {
            settings = await prisma.restaurantSetting.update({
                where: { id: settings.id },
                data: { is_accepting_orders: !!value }
            });
        }
        await logAdminAction('UPDATE_SETTING', 'Settings', 'accepting_orders', { is_accepting_orders: !!value });
        res.json({
            success: true,
            data: settings,
            message: `Orders acceptance turned ${value ? 'ON' : 'OFF'}`
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to toggle accepting orders' });
    }
});
// =============================================================
// 3. MENU MANAGEMENT ENDPOINTS
// =============================================================
router.get('/dishes', async (req, res) => {
    try {
        const { search, category, archived } = req.query;
        const where = {};
        if (archived === 'true') {
            where.is_archived = true;
        }
        else if (archived === 'all') {
            // return both
        }
        else {
            where.is_archived = false;
        }
        if (category && category !== 'All') {
            where.category = category;
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } }
            ];
        }
        const dishes = await prisma.dish.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: dishes });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch dishes' });
    }
});
router.post('/dishes', async (req, res) => {
    try {
        const { name, description, category, price, is_veg, image_url, is_available = true } = req.body;
        if (!name || !category || price === undefined) {
            return res.status(400).json({ success: false, message: 'Name, category, and price are required' });
        }
        const dish = await prisma.dish.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                category: category.trim(),
                price: parseInt(price),
                is_veg: !!is_veg,
                image_url: image_url || null,
                is_available: !!is_available,
                is_archived: false
            }
        });
        await logAdminAction('CREATE', 'Dish', dish.id, { name: dish.name, price: dish.price });
        res.json({ success: true, data: dish, message: 'Dish created successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create dish' });
    }
});
router.patch('/dishes/:id', async (req, res) => {
    try {
        const { name, description, category, price, is_veg, image_url, is_available } = req.body;
        const data = {};
        if (name !== undefined)
            data.name = name.trim();
        if (description !== undefined)
            data.description = description ? description.trim() : null;
        if (category !== undefined)
            data.category = category.trim();
        if (price !== undefined)
            data.price = parseInt(price);
        if (is_veg !== undefined)
            data.is_veg = !!is_veg;
        if (image_url !== undefined)
            data.image_url = image_url;
        if (is_available !== undefined)
            data.is_available = !!is_available;
        const dish = await prisma.dish.update({
            where: { id: req.params.id },
            data
        });
        await logAdminAction('UPDATE', 'Dish', dish.id, data);
        res.json({ success: true, data: dish, message: 'Dish updated successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update dish' });
    }
});
router.patch('/dishes/:id/availability', async (req, res) => {
    try {
        const { is_available } = req.body;
        const dish = await prisma.dish.update({
            where: { id: req.params.id },
            data: { is_available: !!is_available }
        });
        await logAdminAction('AVAILABILITY_CHANGE', 'Dish', dish.id, { is_available: !!is_available });
        res.json({ success: true, data: dish, message: `Dish marked as ${is_available ? 'Available' : 'Unavailable'}` });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update availability' });
    }
});
// Soft archive dish (preserves past orders)
router.delete('/dishes/:id', async (req, res) => {
    try {
        const dish = await prisma.dish.update({
            where: { id: req.params.id },
            data: { is_archived: true, is_available: false }
        });
        await logAdminAction('ARCHIVE', 'Dish', dish.id, { name: dish.name });
        res.json({ success: true, message: 'Dish archived successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to archive dish' });
    }
});
// Dish Image Upload
router.post('/dishes/:id/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }
        let imageUrl = '';
        if (process.env.CLOUDINARY_URL) {
            // Upload to Cloudinary
            const result = await cloudinary_1.v2.uploader.upload(req.file.path, {
                folder: 'dinesphere/dishes'
            });
            imageUrl = result.secure_url;
            // Optionally remove the local file
            try {
                fs_1.default.unlinkSync(req.file.path);
            }
            catch (e) { }
        }
        else {
            const serverBase = process.env.API_URL || 'http://localhost:5000';
            imageUrl = `${serverBase}/uploads/dishes/${req.file.filename}`;
        }
        const dish = await prisma.dish.update({
            where: { id: req.params.id },
            data: { image_url: imageUrl }
        });
        await logAdminAction('IMAGE_UPLOAD', 'Dish', dish.id, { image_url: imageUrl });
        res.json({ success: true, data: { image_url: imageUrl, dish }, message: 'Image uploaded successfully' });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message || 'Image upload failed' });
    }
});
// Dish Ingredients
router.get('/dishes/:id/ingredients', async (req, res) => {
    try {
        const ingredients = await prisma.dishIngredient.findMany({
            where: { dish_id: req.params.id }
        });
        const itemIds = ingredients.map(i => i.item_id);
        const items = await prisma.inventoryItem.findMany({ where: { id: { in: itemIds } } });
        const itemMap = new Map(items.map(i => [i.id, i]));
        const enriched = ingredients.map(i => ({
            ...i,
            item: itemMap.get(i.item_id)
        }));
        res.json({ success: true, data: enriched });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch dish ingredients' });
    }
});
router.put('/dishes/:id/ingredients', async (req, res) => {
    try {
        const { ingredients } = req.body; // Array of { item_id, qty_per_dish }
        if (!Array.isArray(ingredients)) {
            return res.status(400).json({ success: false, message: 'Ingredients must be an array' });
        }
        await prisma.$transaction(async (tx) => {
            await tx.dishIngredient.deleteMany({ where: { dish_id: req.params.id } });
            for (const ing of ingredients) {
                if (ing.item_id && ing.qty_per_dish > 0) {
                    await tx.dishIngredient.create({
                        data: {
                            dish_id: req.params.id,
                            item_id: ing.item_id,
                            qty_per_dish: parseFloat(ing.qty_per_dish)
                        }
                    });
                }
            }
        });
        await logAdminAction('UPDATE_RECIPE', 'Dish', req.params.id, { ingredientsCount: ingredients.length });
        res.json({ success: true, message: 'Dish recipe ingredients updated successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update ingredients' });
    }
});
// =============================================================
// 4. INVENTORY ENDPOINTS
// =============================================================
router.get('/inventory', async (req, res) => {
    try {
        const { search, low } = req.query;
        let items = await prisma.inventoryItem.findMany({
            orderBy: { name: 'asc' }
        });
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(it => it.name.toLowerCase().includes(q) || it.unit.toLowerCase().includes(q));
        }
        if (low === 'true') {
            items = items.filter(it => it.quantity <= it.low_threshold);
        }
        const totalValue = items.reduce((sum, it) => sum + it.quantity * it.cost_per_unit, 0);
        res.json({
            success: true,
            data: {
                items,
                totalValue: Math.round(totalValue),
                lowStockCount: items.filter(it => it.quantity <= it.low_threshold).length
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
    }
});
router.post('/inventory', async (req, res) => {
    try {
        const { name, unit, quantity = 0, low_threshold = 5, cost_per_unit = 0 } = req.body;
        if (!name || !unit) {
            return res.status(400).json({ success: false, message: 'Item name and unit are required' });
        }
        const item = await prisma.inventoryItem.create({
            data: {
                name: name.trim(),
                unit: unit.trim(),
                quantity: parseFloat(quantity),
                low_threshold: parseFloat(low_threshold),
                cost_per_unit: parseFloat(cost_per_unit),
                minStock: parseFloat(low_threshold),
                costPerUnit: parseFloat(cost_per_unit)
            }
        });
        await logAdminAction('CREATE', 'Inventory', item.id, { name: item.name, quantity: item.quantity });
        res.json({ success: true, data: item, message: 'Inventory item added' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to add inventory item' });
    }
});
router.patch('/inventory/:id', async (req, res) => {
    try {
        const { name, unit, low_threshold, cost_per_unit } = req.body;
        const data = {};
        if (name !== undefined)
            data.name = name.trim();
        if (unit !== undefined)
            data.unit = unit.trim();
        if (low_threshold !== undefined) {
            data.low_threshold = parseFloat(low_threshold);
            data.minStock = parseFloat(low_threshold);
        }
        if (cost_per_unit !== undefined) {
            data.cost_per_unit = parseFloat(cost_per_unit);
            data.costPerUnit = parseFloat(cost_per_unit);
        }
        const item = await prisma.inventoryItem.update({
            where: { id: req.params.id },
            data
        });
        await logAdminAction('UPDATE', 'Inventory', item.id, data);
        res.json({ success: true, data: item, message: 'Inventory item updated' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update inventory item' });
    }
});
// Adjust stock (Restock or Wastage with reason)
router.post('/inventory/:id/adjust', async (req, res) => {
    try {
        const { delta, reason } = req.body;
        if (delta === undefined || isNaN(parseFloat(delta))) {
            return res.status(400).json({ success: false, message: 'Adjustment delta amount is required' });
        }
        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: 'Adjustment reason is required' });
        }
        const currentItem = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
        if (!currentItem)
            return res.status(404).json({ success: false, message: 'Item not found' });
        const newQty = Math.max(0, currentItem.quantity + parseFloat(delta));
        const updated = await prisma.inventoryItem.update({
            where: { id: currentItem.id },
            data: { quantity: newQty }
        });
        await logAdminAction('STOCK_ADJUST', 'Inventory', currentItem.id, {
            previous: currentItem.quantity,
            delta: parseFloat(delta),
            newQuantity: newQty,
            reason: reason.trim()
        });
        res.json({
            success: true,
            data: updated,
            message: `Stock adjusted by ${delta > 0 ? '+' : ''}${delta} ${currentItem.unit}`
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to adjust stock' });
    }
});
router.delete('/inventory/:id', async (req, res) => {
    try {
        await prisma.inventoryItem.delete({ where: { id: req.params.id } });
        await logAdminAction('DELETE', 'Inventory', req.params.id);
        res.json({ success: true, message: 'Inventory item deleted' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete inventory item' });
    }
});
// =============================================================
// 5. TABLES & FLOOR MANAGEMENT ENDPOINTS
// =============================================================
router.get('/tables', async (req, res) => {
    try {
        const tables = await prisma.floorTable.findMany({
            orderBy: [{ row_label: 'asc' }, { col_index: 'asc' }]
        });
        res.json({ success: true, data: tables });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch floor tables' });
    }
});
router.post('/tables', async (req, res) => {
    try {
        const { label, zone = 'Regular', seats = 4, fee = 0, is_active = true } = req.body;
        if (!label)
            return res.status(400).json({ success: false, message: 'Table label required' });
        const row = label.charAt(0).toUpperCase();
        const col = parseInt(label.slice(1)) || 1;
        const block = col <= 2 ? 'left' : col <= 4 ? 'center' : 'right';
        const table = await prisma.floorTable.create({
            data: {
                label: label.trim().toUpperCase(),
                zone,
                row_label: row,
                col_index: col,
                block,
                seats: parseInt(seats),
                fee: parseInt(fee),
                is_active: !!is_active
            }
        });
        await logAdminAction('CREATE', 'Table', table.id, { label: table.label, zone: table.zone });
        res.json({ success: true, data: table, message: 'Table created' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create table (label must be unique)' });
    }
});
router.patch('/tables/:id', async (req, res) => {
    try {
        const { label, zone, seats, fee, is_active } = req.body;
        const data = {};
        if (label !== undefined)
            data.label = label.trim().toUpperCase();
        if (zone !== undefined)
            data.zone = zone;
        if (seats !== undefined)
            data.seats = parseInt(seats);
        if (fee !== undefined)
            data.fee = parseInt(fee);
        if (is_active !== undefined)
            data.is_active = !!is_active;
        const table = await prisma.floorTable.update({
            where: { id: req.params.id },
            data
        });
        await logAdminAction('UPDATE', 'Table', table.id, data);
        res.json({ success: true, data: table, message: 'Table updated successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update table' });
    }
});
// Delete table (reject if future bookings exist)
router.delete('/tables/:id', async (req, res) => {
    try {
        const table = await prisma.floorTable.findUnique({ where: { id: req.params.id } });
        if (!table)
            return res.status(404).json({ success: false, message: 'Table not found' });
        const todayStr = new Date().toISOString().split('T')[0];
        const futureBookings = await prisma.cinemaReservationTable.findFirst({
            where: {
                table_id: table.id,
                date: { gte: todayStr },
                active: true
            }
        });
        if (futureBookings) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete table with future reservations. Deactivate it instead.'
            });
        }
        await prisma.floorTable.delete({ where: { id: table.id } });
        await logAdminAction('DELETE', 'Table', table.id, { label: table.label });
        res.json({ success: true, message: 'Table deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete table' });
    }
});
// Table Blocks
router.get('/table-blocks', async (req, res) => {
    try {
        const { date } = req.query;
        const where = {};
        if (date)
            where.date = date;
        const blocks = await prisma.tableBlock.findMany({
            where,
            orderBy: { created_at: 'desc' }
        });
        const tableIds = blocks.map(b => b.table_id);
        const tables = await prisma.floorTable.findMany({ where: { id: { in: tableIds } } });
        const tableMap = new Map(tables.map(t => [t.id, t]));
        const enriched = blocks.map(b => ({
            ...b,
            table: tableMap.get(b.table_id)
        }));
        res.json({ success: true, data: enriched });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch table blocks' });
    }
});
router.post('/table-blocks', async (req, res) => {
    try {
        const { table_id, date, time_slot, reason } = req.body;
        if (!table_id || !date || !reason) {
            return res.status(400).json({ success: false, message: 'Table, date, and reason are required' });
        }
        const block = await prisma.tableBlock.create({
            data: {
                table_id,
                date,
                time_slot: time_slot || null,
                reason: reason.trim()
            }
        });
        await logAdminAction('CREATE_BLOCK', 'TableBlock', block.id, { table_id, date, time_slot, reason });
        res.json({ success: true, data: block, message: 'Table blocked successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to block table' });
    }
});
router.delete('/table-blocks/:id', async (req, res) => {
    try {
        await prisma.tableBlock.delete({ where: { id: req.params.id } });
        await logAdminAction('DELETE_BLOCK', 'TableBlock', req.params.id);
        res.json({ success: true, message: 'Table block removed' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to remove table block' });
    }
});
// =============================================================
// 6. RESERVATIONS ENDPOINTS
// =============================================================
router.get('/reservations', async (req, res) => {
    try {
        const { date, slot, status, search } = req.query;
        const where = {};
        if (date)
            where.date = date;
        if (slot)
            where.time_slot = slot;
        if (status && status !== 'All')
            where.status = status;
        if (search) {
            where.OR = [
                { code: { contains: search } },
                { guest_name: { contains: search } },
                { guest_phone: { contains: search } }
            ];
        }
        const reservations = await prisma.cinemaReservation.findMany({
            where,
            include: { tables: true },
            orderBy: { created_at: 'desc' }
        });
        const userIds = reservations.map(r => r.user_id).filter(Boolean);
        const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
        const userMap = new Map(users.map(u => [u.id, u]));
        const enriched = reservations.map(r => {
            const u = r.user_id ? userMap.get(r.user_id) : null;
            return {
                ...r,
                customer_name: r.guest_name || u?.name || 'Guest',
                customer_phone: r.guest_phone || u?.phone || '',
                customer_email: u?.email || '',
                table_labels: r.tables.map(t => t.table_label).join(', ')
            };
        });
        res.json({ success: true, data: enriched });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch reservations' });
    }
});
router.get('/reservations/:id', async (req, res) => {
    try {
        const resv = await prisma.cinemaReservation.findUnique({
            where: { id: req.params.id },
            include: { tables: true }
        });
        if (!resv)
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        let user = null;
        if (resv.user_id) {
            user = await prisma.user.findUnique({ where: { id: resv.user_id } });
        }
        res.json({
            success: true,
            data: {
                ...resv,
                user,
                table_labels: resv.tables.map(t => t.table_label).join(', ')
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch reservation' });
    }
});
// Create Walk-in Reservation
router.post('/reservations/walk-in', async (req, res) => {
    try {
        const { guest_name, guest_phone, guests, date, time_slot, table_ids } = req.body;
        if (!guest_name || !guests || !date || !time_slot || !table_ids || !table_ids.length) {
            return res.status(400).json({ success: false, message: 'All walk-in booking details are required' });
        }
        const tables = await prisma.floorTable.findMany({
            where: { id: { in: table_ids }, is_active: true }
        });
        if (tables.length !== table_ids.length) {
            return res.status(400).json({ success: false, message: 'Selected tables not found or inactive' });
        }
        // Check conflict
        const activeBookings = await prisma.cinemaReservationTable.findMany({
            where: {
                date,
                time_slot,
                active: true,
                table_id: { in: table_ids }
            }
        });
        if (activeBookings.length > 0) {
            return res.status(409).json({ success: false, message: 'One or more of the selected tables are already booked' });
        }
        // Generate code
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = 'DS-W';
        for (let i = 0; i < 5; i++)
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        const fee_total = tables.reduce((sum, t) => sum + t.fee, 0);
        const reservation = await prisma.$transaction(async (tx) => {
            const resv = await tx.cinemaReservation.create({
                data: {
                    user_id: null,
                    guest_name: guest_name.trim(),
                    guest_phone: guest_phone ? guest_phone.trim() : null,
                    source: 'walk-in',
                    code,
                    date,
                    time_slot,
                    guests: parseInt(guests),
                    fee_total,
                    payment_method: 'Cash',
                    status: 'Confirmed'
                }
            });
            for (const t of tables) {
                await tx.cinemaReservationTable.create({
                    data: {
                        reservation_id: resv.id,
                        table_id: t.id,
                        table_label: t.label,
                        date,
                        time_slot,
                        active: true,
                        active_slot_key: `${t.id}_${date}_${time_slot}`
                    }
                });
            }
            return resv;
        });
        await logAdminAction('CREATE_WALK_IN', 'Reservation', reservation.id, { code, guest_name, tables: tables.map(t => t.label) });
        res.json({ success: true, data: reservation, message: 'Walk-in reservation confirmed!' });
    }
    catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Double booking conflict on selected tables' });
        }
        res.status(500).json({ success: false, message: 'Failed to create walk-in reservation' });
    }
});
// Update Reservation Status (Seated, Completed, No-show, Cancelled)
router.patch('/reservations/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['Confirmed', 'Seated', 'Completed', 'No-show', 'Cancelled'];
        if (!status || !allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const reservation = await prisma.cinemaReservation.findUnique({
            where: { id: req.params.id },
            include: { tables: true }
        });
        if (!reservation)
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        await prisma.$transaction(async (tx) => {
            await tx.cinemaReservation.update({
                where: { id: reservation.id },
                data: { status }
            });
            if (status === 'Cancelled') {
                for (const t of reservation.tables) {
                    await tx.cinemaReservationTable.update({
                        where: { id: t.id },
                        data: {
                            active: false,
                            active_slot_key: `${t.table_id}_${t.date}_${t.time_slot}_cancelled_${t.id}`
                        }
                    });
                }
            }
            if (reservation.user_id) {
                await tx.customerNotification.create({
                    data: {
                        user_id: reservation.user_id,
                        title: `Reservation Update: ${status}`,
                        message: `Your booking (Code: ${reservation.code}) for ${reservation.date} is now marked as ${status}.`
                    }
                });
            }
        });
        await logAdminAction('STATUS_CHANGE', 'Reservation', reservation.id, { from: reservation.status, to: status });
        res.json({ success: true, message: `Reservation marked as ${status}` });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update reservation status' });
    }
});
// Move Reservation to other free tables
router.patch('/reservations/:id/tables', async (req, res) => {
    try {
        const { table_ids } = req.body;
        if (!table_ids || !Array.isArray(table_ids) || !table_ids.length) {
            return res.status(400).json({ success: false, message: 'New table IDs required' });
        }
        const reservation = await prisma.cinemaReservation.findUnique({
            where: { id: req.params.id },
            include: { tables: true }
        });
        if (!reservation)
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        const newTables = await prisma.floorTable.findMany({
            where: { id: { in: table_ids }, is_active: true }
        });
        if (newTables.length !== table_ids.length) {
            return res.status(400).json({ success: false, message: 'One or more selected tables not found' });
        }
        // Check conflict on new tables
        const conflicts = await prisma.cinemaReservationTable.findMany({
            where: {
                date: reservation.date,
                time_slot: reservation.time_slot,
                active: true,
                table_id: { in: table_ids },
                reservation_id: { not: reservation.id }
            }
        });
        if (conflicts.length > 0) {
            return res.status(409).json({ success: false, message: 'One or more of the destination tables are already booked' });
        }
        await prisma.$transaction(async (tx) => {
            // Deactivate old tables
            for (const t of reservation.tables) {
                await tx.cinemaReservationTable.update({
                    where: { id: t.id },
                    data: {
                        active: false,
                        active_slot_key: `${t.table_id}_${t.date}_${t.time_slot}_moved_${t.id}`
                    }
                });
            }
            // Add new tables
            for (const t of newTables) {
                await tx.cinemaReservationTable.create({
                    data: {
                        reservation_id: reservation.id,
                        table_id: t.id,
                        table_label: t.label,
                        date: reservation.date,
                        time_slot: reservation.time_slot,
                        active: true,
                        active_slot_key: `${t.id}_${reservation.date}_${reservation.time_slot}`
                    }
                });
            }
        });
        await logAdminAction('MOVE_TABLES', 'Reservation', reservation.id, {
            old: reservation.tables.map(t => t.table_label),
            new: newTables.map(t => t.label)
        });
        res.json({ success: true, message: `Reservation relocated to Table(s) ${newTables.map(t => t.label).join(', ')}` });
    }
    catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Slot key conflict on new tables' });
        }
        res.status(500).json({ success: false, message: 'Failed to move reservation' });
    }
});
// Day Map for Table States
router.get('/reservations/day-map', async (req, res) => {
    try {
        const { date, slot } = req.query;
        if (!date || !slot) {
            return res.status(400).json({ success: false, message: 'Date and slot are required' });
        }
        const [tables, bookings, blocks] = await Promise.all([
            prisma.floorTable.findMany({ where: { is_active: true } }),
            prisma.cinemaReservationTable.findMany({
                where: { date, time_slot: slot, active: true },
                include: { reservation: true }
            }),
            prisma.tableBlock.findMany({
                where: {
                    date,
                    OR: [
                        { time_slot: slot },
                        { time_slot: null }
                    ]
                }
            })
        ]);
        const bookingMap = new Map(bookings.map(b => [b.table_id, b.reservation]));
        const blockMap = new Map(blocks.map(b => [b.table_id, b]));
        const dayMap = tables.map(t => {
            const booked = bookingMap.get(t.id);
            const blocked = blockMap.get(t.id);
            let state = 'free';
            let details = null;
            if (blocked) {
                state = 'blocked';
                details = { reason: blocked.reason };
            }
            else if (booked) {
                state = 'booked';
                details = {
                    code: booked.code,
                    guest_name: booked.guest_name || 'Guest',
                    guests: booked.guests,
                    status: booked.status
                };
            }
            return {
                id: t.id,
                label: t.label,
                zone: t.zone,
                seats: t.seats,
                state,
                details
            };
        });
        res.json({ success: true, data: dayMap });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch day map' });
    }
});
// =============================================================
// 7. CUSTOMERS ENDPOINTS
// =============================================================
router.get('/customers', async (req, res) => {
    try {
        const { search, status, page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.max(1, Math.min(100, parseInt(limit)));
        const where = { role: 'CUSTOMER' };
        if (status === 'active')
            where.is_active = true;
        if (status === 'disabled')
            where.is_active = false;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } }
            ];
        }
        const [total, customers] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    points: true,
                    is_active: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * pageSize,
                take: pageSize
            })
        ]);
        // Calculate customer order stats
        const customerIds = customers.map(c => c.id);
        const orders = await prisma.customerOrder.findMany({
            where: { user_id: { in: customerIds }, status: { not: 'Cancelled' } },
            select: { user_id: true, total: true }
        });
        const spendMap = {};
        for (const o of orders) {
            if (!spendMap[o.user_id])
                spendMap[o.user_id] = { count: 0, spent: 0 };
            spendMap[o.user_id].count += 1;
            spendMap[o.user_id].spent += o.total;
        }
        const enriched = customers.map(c => {
            const stats = spendMap[c.id] || { count: 0, spent: 0 };
            let level = 'BRONZE';
            if (c.points >= 800)
                level = 'PLATINUM';
            else if (c.points >= 400)
                level = 'GOLD';
            else if (c.points >= 150)
                level = 'SILVER';
            return {
                ...c,
                orderCount: stats.count,
                totalSpent: stats.spent,
                level
            };
        });
        res.json({
            success: true,
            data: {
                customers: enriched,
                pagination: {
                    total,
                    page: pageNum,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch customers' });
    }
});
router.get('/customers/:id', async (req, res) => {
    try {
        const customer = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                points: true,
                is_active: true,
                createdAt: true,
                dietary_pref: true,
                allergies: true
            }
        });
        if (!customer)
            return res.status(404).json({ success: false, message: 'Customer not found' });
        const [orders, reservations, tickets] = await Promise.all([
            prisma.customerOrder.findMany({
                where: { user_id: customer.id },
                include: { items: true },
                orderBy: { created_at: 'desc' },
                take: 5
            }),
            prisma.cinemaReservation.findMany({
                where: { user_id: customer.id },
                include: { tables: true },
                orderBy: { created_at: 'desc' },
                take: 5
            }),
            prisma.supportTicket.findMany({
                where: { user_id: customer.id },
                orderBy: { created_at: 'desc' },
                take: 5
            })
        ]);
        const allOrders = await prisma.customerOrder.findMany({
            where: { user_id: customer.id, status: { not: 'Cancelled' } },
            select: { total: true }
        });
        const totalSpent = allOrders.reduce((sum, o) => sum + o.total, 0);
        let level = 'BRONZE';
        if (customer.points >= 800)
            level = 'PLATINUM';
        else if (customer.points >= 400)
            level = 'GOLD';
        else if (customer.points >= 150)
            level = 'SILVER';
        res.json({
            success: true,
            data: {
                profile: customer,
                level,
                stats: {
                    orderCount: allOrders.length,
                    totalSpent
                },
                orders,
                reservations,
                tickets
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch customer profile' });
    }
});
// Toggle customer active/disabled
router.patch('/customers/:id/toggle', async (req, res) => {
    try {
        const customer = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!customer)
            return res.status(404).json({ success: false, message: 'Customer not found' });
        const updated = await prisma.user.update({
            where: { id: customer.id },
            data: { is_active: !customer.is_active }
        });
        await logAdminAction('CUSTOMER_TOGGLE', 'Customer', customer.id, { is_active: updated.is_active });
        res.json({
            success: true,
            data: updated,
            message: `Customer account ${updated.is_active ? 'enabled' : 'disabled'}`
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to toggle customer' });
    }
});
// Adjust customer points with required reason
router.post('/customers/:id/points', async (req, res) => {
    try {
        const { delta, reason } = req.body;
        if (delta === undefined || isNaN(parseInt(delta))) {
            return res.status(400).json({ success: false, message: 'Points delta is required' });
        }
        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: 'Adjustment reason is required' });
        }
        const customer = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!customer)
            return res.status(404).json({ success: false, message: 'Customer not found' });
        const newPoints = Math.max(0, customer.points + parseInt(delta));
        const updated = await prisma.user.update({
            where: { id: customer.id },
            data: { points: newPoints }
        });
        await prisma.customerNotification.create({
            data: {
                user_id: customer.id,
                title: 'Rewards Points Updated',
                message: `Your rewards balance was adjusted by ${delta > 0 ? '+' : ''}${delta} points (${reason.trim()}). Current balance: ${newPoints} pts.`
            }
        });
        await logAdminAction('POINTS_ADJUST', 'Customer', customer.id, {
            previous: customer.points,
            delta: parseInt(delta),
            newPoints,
            reason: reason.trim()
        });
        res.json({ success: true, data: updated, message: `Points updated to ${newPoints}` });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to adjust points' });
    }
});
// =============================================================
// 8. COUPONS ENDPOINTS
// =============================================================
router.get('/coupons', async (req, res) => {
    try {
        const coupons = await prisma.customerCoupon.findMany({
            orderBy: { is_active: 'desc' }
        });
        res.json({ success: true, data: coupons });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
    }
});
router.post('/coupons', async (req, res) => {
    try {
        const { code, description, discount_percent, min_order, usage_limit, per_user_limit = 1, valid_from, expires_at } = req.body;
        if (!code || !description || !discount_percent || min_order === undefined) {
            return res.status(400).json({ success: false, message: 'Code, description, discount percent, and min order are required' });
        }
        const pct = parseInt(discount_percent);
        if (pct < 1 || pct > 90) {
            return res.status(400).json({ success: false, message: 'Discount percent must be between 1 and 90' });
        }
        const coupon = await prisma.customerCoupon.create({
            data: {
                code: code.trim().toUpperCase(),
                description: description.trim(),
                discount_percent: pct,
                min_order: parseInt(min_order),
                usage_limit: usage_limit ? parseInt(usage_limit) : null,
                used_count: 0,
                per_user_limit: per_user_limit ? parseInt(per_user_limit) : 1,
                valid_from: valid_from ? new Date(valid_from) : null,
                expires_at: expires_at ? new Date(expires_at) : null,
                is_active: true
            }
        });
        await logAdminAction('CREATE', 'Coupon', coupon.id, { code: coupon.code, discount_percent: coupon.discount_percent });
        res.json({ success: true, data: coupon, message: 'Coupon created successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to create coupon (code must be unique)' });
    }
});
router.patch('/coupons/:id', async (req, res) => {
    try {
        const { description, discount_percent, min_order, usage_limit, per_user_limit, valid_from, expires_at, is_active } = req.body;
        const data = {};
        if (description !== undefined)
            data.description = description.trim();
        if (discount_percent !== undefined)
            data.discount_percent = parseInt(discount_percent);
        if (min_order !== undefined)
            data.min_order = parseInt(min_order);
        if (usage_limit !== undefined)
            data.usage_limit = usage_limit ? parseInt(usage_limit) : null;
        if (per_user_limit !== undefined)
            data.per_user_limit = parseInt(per_user_limit);
        if (valid_from !== undefined)
            data.valid_from = valid_from ? new Date(valid_from) : null;
        if (expires_at !== undefined)
            data.expires_at = expires_at ? new Date(expires_at) : null;
        if (is_active !== undefined)
            data.is_active = !!is_active;
        const coupon = await prisma.customerCoupon.update({
            where: { id: req.params.id },
            data
        });
        await logAdminAction('UPDATE', 'Coupon', coupon.id, data);
        res.json({ success: true, data: coupon, message: 'Coupon updated successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update coupon' });
    }
});
router.patch('/coupons/:id/toggle', async (req, res) => {
    try {
        const coupon = await prisma.customerCoupon.findUnique({ where: { id: req.params.id } });
        if (!coupon)
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        const updated = await prisma.customerCoupon.update({
            where: { id: coupon.id },
            data: { is_active: !coupon.is_active }
        });
        await logAdminAction('COUPON_TOGGLE', 'Coupon', coupon.id, { is_active: updated.is_active });
        res.json({ success: true, data: updated, message: `Coupon ${updated.is_active ? 'activated' : 'deactivated'}` });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to toggle coupon' });
    }
});
// =============================================================
// 9. REVIEWS ENDPOINTS
// =============================================================
router.get('/reviews', async (req, res) => {
    try {
        const { rating, hidden } = req.query;
        const where = {};
        if (rating && rating !== 'All')
            where.rating = parseInt(rating);
        if (hidden === 'true')
            where.is_hidden = true;
        if (hidden === 'false')
            where.is_hidden = false;
        const reviews = await prisma.customerReview.findMany({
            where,
            orderBy: { created_at: 'desc' }
        });
        const userIds = Array.from(new Set(reviews.map(r => r.user_id)));
        const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
        const userMap = new Map(users.map(u => [u.id, u]));
        const enriched = reviews.map(r => ({
            ...r,
            customer: userMap.get(r.user_id) || { name: 'Customer', email: '' }
        }));
        const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '5.0';
        res.json({
            success: true,
            data: {
                reviews: enriched,
                avgRating,
                total: reviews.length
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});
router.patch('/reviews/:id/hide', async (req, res) => {
    try {
        const review = await prisma.customerReview.findUnique({ where: { id: req.params.id } });
        if (!review)
            return res.status(404).json({ success: false, message: 'Review not found' });
        const updated = await prisma.customerReview.update({
            where: { id: review.id },
            data: { is_hidden: !review.is_hidden }
        });
        await logAdminAction('REVIEW_HIDE_TOGGLE', 'Review', review.id, { is_hidden: updated.is_hidden });
        res.json({
            success: true,
            data: updated,
            message: `Review is now ${updated.is_hidden ? 'Hidden' : 'Visible'}`
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to toggle review visibility' });
    }
});
router.post('/reviews/:id/reply', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
        }
        const review = await prisma.customerReview.update({
            where: { id: req.params.id },
            data: { admin_reply: message.trim() }
        });
        await prisma.customerNotification.create({
            data: {
                user_id: review.user_id,
                title: 'Restaurant Replied to Your Review',
                message: `DineSphere management replied: "${message.trim().slice(0, 120)}..."`
            }
        });
        await logAdminAction('REVIEW_REPLY', 'Review', review.id, { reply: message.trim() });
        res.json({ success: true, data: review, message: 'Reply posted successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to post reply' });
    }
});
// =============================================================
// 10. SUPPORT TICKETS ENDPOINTS
// =============================================================
router.get('/tickets', async (req, res) => {
    try {
        const { status } = req.query;
        const where = {};
        if (status && status !== 'All')
            where.status = status;
        const tickets = await prisma.supportTicket.findMany({
            where,
            orderBy: { created_at: 'desc' }
        });
        const userIds = Array.from(new Set(tickets.map(t => t.user_id)));
        const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
        const userMap = new Map(users.map(u => [u.id, u]));
        const enriched = tickets.map(t => ({
            ...t,
            customer: userMap.get(t.user_id) || { name: 'Customer', email: '', phone: '' }
        }));
        res.json({ success: true, data: enriched });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
    }
});
router.get('/tickets/:id', async (req, res) => {
    try {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id: req.params.id }
        });
        if (!ticket)
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        const [customer, replies] = await Promise.all([
            prisma.user.findUnique({ where: { id: ticket.user_id } }),
            prisma.ticketReply.findMany({
                where: { ticket_id: ticket.id },
                orderBy: { created_at: 'asc' }
            })
        ]);
        res.json({
            success: true,
            data: {
                ticket,
                customer: customer || { name: 'Customer', email: '', phone: '' },
                replies
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
    }
});
router.post('/tickets/:id/reply', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Reply message cannot be empty' });
        }
        const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
        if (!ticket)
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        const reply = await prisma.ticketReply.create({
            data: {
                ticket_id: ticket.id,
                author_role: 'admin',
                message: message.trim()
            }
        });
        await prisma.customerNotification.create({
            data: {
                user_id: ticket.user_id,
                title: `Reply on Support Ticket: ${ticket.subject}`,
                message: `Admin replied: "${message.trim().slice(0, 150)}..."`
            }
        });
        await logAdminAction('TICKET_REPLY', 'SupportTicket', ticket.id, { message: message.trim() });
        res.json({ success: true, data: reply, message: 'Reply sent' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to send reply' });
    }
});
router.patch('/tickets/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['Open', 'Closed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be Open or Closed' });
        }
        const ticket = await prisma.supportTicket.update({
            where: { id: req.params.id },
            data: { status }
        });
        await logAdminAction('TICKET_STATUS', 'SupportTicket', ticket.id, { status });
        res.json({ success: true, data: ticket, message: `Ticket marked as ${status}` });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update ticket status' });
    }
});
// =============================================================
// 11. ANNOUNCEMENTS ENDPOINTS
// =============================================================
let lastAnnouncementTime = 0;
router.post('/announcements', async (req, res) => {
    try {
        const now = Date.now();
        if (now - lastAnnouncementTime < 60 * 1000) {
            const waitSec = Math.ceil((60000 - (now - lastAnnouncementTime)) / 1000);
            return res.status(429).json({
                success: false,
                message: `Rate limit: Please wait ${waitSec}s before sending another broadcast.`
            });
        }
        const { title, message, audience = 'all' } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required' });
        }
        if (message.length > 300) {
            return res.status(400).json({ success: false, message: 'Announcement message cannot exceed 300 characters' });
        }
        // Determine targeted customers
        let targetCustomers = [];
        if (audience === 'gold_and_above') {
            targetCustomers = await prisma.user.findMany({
                where: { role: 'CUSTOMER', points: { gte: 400 }, is_active: true }
            });
        }
        else if (audience === 'inactive_30d') {
            const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
            const activeUserIds = (await prisma.customerOrder.findMany({
                where: { created_at: { gte: thirtyDaysAgo } },
                select: { user_id: true }
            })).map(o => o.user_id);
            targetCustomers = await prisma.user.findMany({
                where: {
                    role: 'CUSTOMER',
                    id: { notIn: activeUserIds },
                    is_active: true
                }
            });
        }
        else {
            targetCustomers = await prisma.user.findMany({
                where: { role: 'CUSTOMER', is_active: true }
            });
        }
        // Create notifications for each targeted customer
        for (const cust of targetCustomers) {
            await prisma.customerNotification.create({
                data: {
                    user_id: cust.id,
                    audience,
                    title: title.trim(),
                    message: message.trim()
                }
            });
        }
        lastAnnouncementTime = now;
        await logAdminAction('BROADCAST', 'Announcement', null, {
            title: title.trim(),
            message: message.trim(),
            audience,
            recipientCount: targetCustomers.length
        });
        res.json({
            success: true,
            message: `Announcement broadcasted to ${targetCustomers.length} customer(s)`
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to broadcast announcement' });
    }
});
router.get('/announcements', async (req, res) => {
    try {
        const history = await prisma.adminAction.findMany({
            where: { entity: 'Announcement' },
            orderBy: { created_at: 'desc' }
        });
        const parsed = history.map(h => {
            let details = {};
            try {
                details = JSON.parse(h.details || '{}');
            }
            catch { }
            return {
                id: h.id,
                title: details.title || 'Announcement',
                message: details.message || '',
                audience: details.audience || 'all',
                recipientCount: details.recipientCount || 0,
                createdAt: h.created_at
            };
        });
        res.json({ success: true, data: parsed });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch announcement history' });
    }
});
// =============================================================
// 12. SETTINGS & AUDIT LOG ENDPOINTS
// =============================================================
router.get('/settings', async (req, res) => {
    try {
        let settings = await prisma.restaurantSetting.findFirst();
        if (!settings) {
            settings = await prisma.restaurantSetting.create({
                data: {}
            });
        }
        let parsedSlots = ['12:00', '13:30', '15:00', '18:30', '19:30', '20:30', '21:30'];
        try {
            parsedSlots = JSON.parse(settings.reservation_slots);
        }
        catch { }
        res.json({
            success: true,
            data: {
                ...settings,
                reservation_slots: parsedSlots
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
});
router.patch('/settings', async (req, res) => {
    try {
        const { restaurant_name, phone, address, tax_percent, points_per_rupees, reservation_slots, max_days_ahead, hold_minutes, cancel_window_hours, max_tables_per_booking, is_accepting_orders } = req.body;
        const data = {};
        if (restaurant_name !== undefined)
            data.restaurant_name = restaurant_name.trim();
        if (phone !== undefined)
            data.phone = phone.trim();
        if (address !== undefined)
            data.address = address.trim();
        if (tax_percent !== undefined) {
            const tax = parseFloat(tax_percent);
            if (tax < 0 || tax > 28)
                return res.status(400).json({ success: false, message: 'Tax percent must be between 0% and 28%' });
            data.tax_percent = tax;
        }
        if (points_per_rupees !== undefined)
            data.points_per_rupees = parseFloat(points_per_rupees);
        if (reservation_slots !== undefined) {
            if (Array.isArray(reservation_slots)) {
                data.reservation_slots = JSON.stringify(reservation_slots);
            }
            else if (typeof reservation_slots === 'string') {
                data.reservation_slots = reservation_slots;
            }
        }
        if (max_days_ahead !== undefined) {
            const days = parseInt(max_days_ahead);
            if (days < 1 || days > 60)
                return res.status(400).json({ success: false, message: 'Max days ahead must be between 1 and 60' });
            data.max_days_ahead = days;
        }
        if (hold_minutes !== undefined) {
            const mins = parseInt(hold_minutes);
            if (mins < 1 || mins > 15)
                return res.status(400).json({ success: false, message: 'Hold minutes must be between 1 and 15' });
            data.hold_minutes = mins;
        }
        if (cancel_window_hours !== undefined) {
            const hours = parseInt(cancel_window_hours);
            if (hours < 0 || hours > 48)
                return res.status(400).json({ success: false, message: 'Cancellation window must be between 0 and 48 hours' });
            data.cancel_window_hours = hours;
        }
        if (max_tables_per_booking !== undefined)
            data.max_tables_per_booking = parseInt(max_tables_per_booking);
        if (is_accepting_orders !== undefined)
            data.is_accepting_orders = !!is_accepting_orders;
        let settings = await prisma.restaurantSetting.findFirst();
        if (!settings) {
            settings = await prisma.restaurantSetting.create({ data });
        }
        else {
            settings = await prisma.restaurantSetting.update({
                where: { id: settings.id },
                data
            });
        }
        await logAdminAction('UPDATE_SETTINGS', 'Settings', settings.id, data);
        res.json({ success: true, data: settings, message: 'Settings saved successfully' });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
});
// Audit Log
router.get('/audit-log', async (req, res) => {
    try {
        const { entity, page = '1', limit = '30' } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.max(1, Math.min(100, parseInt(limit)));
        const where = {};
        if (entity && entity !== 'All')
            where.entity = entity;
        const [total, logs] = await Promise.all([
            prisma.adminAction.count({ where }),
            prisma.adminAction.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (pageNum - 1) * pageSize,
                take: pageSize
            })
        ]);
        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    total,
                    page: pageNum,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch audit log' });
    }
});
exports.default = router;
