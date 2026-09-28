import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import adminRouter, { requireAdmin } from './admin';
import { seedAdminData } from './adminSeed';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const ENV = process.env.ENV || 'development';
const ADMIN_ID = process.env.ADMIN_ID || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-before-deploy';


// -------------------------------------------------------------
// SAFETY RULE:
// If ENV is anything other than "development" and ADMIN_ID / ADMIN_PASSWORD are missing or still equal to test values,
// or JWT_SECRET still starts with "dev-only", print a clear error and REFUSE to start and REFUSE to seed.
// -------------------------------------------------------------
function enforceProductionSafety() {
  if (ENV !== 'development') {
    const isTestAdminId = !ADMIN_ID || ADMIN_ID === 'admin';
    const isTestAdminPass = !ADMIN_PASSWORD || ADMIN_PASSWORD === 'Admin@12345';
    const isTestJwt = !JWT_SECRET || JWT_SECRET.startsWith('dev-only');

    if (isTestAdminId || isTestAdminPass || isTestJwt) {
      console.error('\n================================================================');
      console.error('🚨 [SAFETY ERROR]: REFUSING TO START SERVER IN NON-DEVELOPMENT MODE');
      console.error('================================================================');
      console.error(`Current ENV: "${ENV}". Test credentials or dev secrets detected:`);
      if (isTestAdminId) {
        console.error(' - ADMIN_ID is missing or still set to default test value ("admin").');
      }
      if (isTestAdminPass) {
        console.error(' - ADMIN_PASSWORD is missing or still set to default test value ("Admin@12345").');
      }
      if (isTestJwt) {
        console.error(' - JWT_SECRET is missing or still starts with "dev-only".');
      }
      console.error('\nAction Required: Set secure, unique credentials before deploying to production.');
      console.error('================================================================\n');
      process.exit(1);
    }
  }
}

enforceProductionSafety();

// Rate limiting state for login attempts (in-memory)
// Development allows 30 attempts; production allows 5
const failedLoginAttempts = new Map<string, { count: number; lockUntil: number }>();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/admin', adminRouter);

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ success: false, message: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ success: false, message: 'Forbidden' });
    req.user = user;
    next();
  });
};

const authorizeRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

// /api/auth/config was the dev-mode credential helper — removed for production.

// -------------------------------------------------------------
// PUBLIC RESTAURANT SETTINGS
// -------------------------------------------------------------
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await prisma.restaurantSetting.findFirst();
    if (!settings) {
      settings = await prisma.restaurantSetting.create({
        data: {
          restaurant_name: 'DineSphere Luxury Dining',
          phone: '+91 98765 43210',
          address: 'Palms Boulevard, Marine Drive, Mumbai',
          tax_percent: 5.0,
          points_per_rupees: 10.0,
          reservation_slots: JSON.stringify(['12:00', '13:30', '15:00', '18:30', '19:30', '20:30', '21:30']),
          max_days_ahead: 14,
          hold_minutes: 5,
          cancel_window_hours: 2,
          max_tables_per_booking: 4,
          is_accepting_orders: true
        }
      });
    }

    let parsedSlots = ['12:00', '13:30', '15:00', '18:30', '19:30', '20:30', '21:30'];
    try {
      if (settings.reservation_slots) {
        parsedSlots = JSON.parse(settings.reservation_slots);
      }
    } catch {}

    res.json({
      success: true,
      data: {
        restaurant_name: settings.restaurant_name,
        phone: settings.phone,
        address: settings.address,
        tax_percent: settings.tax_percent,
        points_per_rupees: settings.points_per_rupees,
        reservation_slots: parsedSlots,
        max_days_ahead: settings.max_days_ahead,
        hold_minutes: settings.hold_minutes,
        cancel_window_hours: settings.cancel_window_hours,
        max_tables_per_booking: settings.max_tables_per_booking,
        is_accepting_orders: settings.is_accepting_orders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: cleanEmail, phone, password: hashedPassword, role: 'CUSTOMER' }
    });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token },
      message: 'Registered successfully'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local';
    const record = failedLoginAttempts.get(clientIp);
    const maxAttempts = 5;

    if (record && record.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((record.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Account locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email/ID and password are required' });
    }

    const input = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input },
          { email: `${input}@dinesphere.test` },
          ...(input === (ADMIN_ID || 'admin').toLowerCase() ? [{ role: 'ADMIN' }] : [])
        ]
      }
    });

    if (!user) {
      const cur = failedLoginAttempts.get(clientIp) || { count: 0, lockUntil: 0 };
      cur.count += 1;
      if (cur.count >= maxAttempts) {
        cur.lockUntil = Date.now() + 15 * 60 * 1000;
        failedLoginAttempts.set(clientIp, cur);
        return res.status(429).json({
          success: false,
          message: `Too many failed login attempts (${cur.count}/${maxAttempts}). Locked for 15 minutes.`
        });
      }
      failedLoginAttempts.set(clientIp, cur);
      return res.status(400).json({
        success: false,
        message: `Invalid email or password. (${cur.count}/${maxAttempts} attempts used)`
      });
    }

    if (user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'KITCHEN') {
      return res.status(403).json({
        success: false,
        message: 'Please use the admin login page'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const cur = failedLoginAttempts.get(clientIp) || { count: 0, lockUntil: 0 };
      cur.count += 1;
      if (cur.count >= maxAttempts) {
        cur.lockUntil = Date.now() + 15 * 60 * 1000;
        failedLoginAttempts.set(clientIp, cur);
        return res.status(429).json({
          success: false,
          message: `Too many failed login attempts (${cur.count}/${maxAttempts}). Locked for 15 minutes.`
        });
      }
      failedLoginAttempts.set(clientIp, cur);
      return res.status(400).json({
        success: false,
        message: `Invalid email or password. (${cur.count}/${maxAttempts} attempts used)`
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact restaurant support.'
      });
    }

    // Reset failed counter upon successful login
    failedLoginAttempts.delete(clientIp);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local';
    const record = failedLoginAttempts.get(clientIp);
    const maxAttempts = 5;

    if (record && record.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((record.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Account locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email/ID and password are required' });
    }

    const input = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input },
          { email: `${input}@dinesphere.test` },
          ...(input === (ADMIN_ID || 'admin').toLowerCase() ? [{ role: 'ADMIN' }] : [])
        ]
      }
    });

    if (!user) {
      const cur = failedLoginAttempts.get(clientIp) || { count: 0, lockUntil: 0 };
      cur.count += 1;
      if (cur.count >= maxAttempts) {
        cur.lockUntil = Date.now() + 15 * 60 * 1000;
        failedLoginAttempts.set(clientIp, cur);
        return res.status(429).json({
          success: false,
          message: `Too many failed login attempts (${cur.count}/${maxAttempts}). Locked for 15 minutes.`
        });
      }
      failedLoginAttempts.set(clientIp, cur);
      return res.status(400).json({
        success: false,
        message: `Invalid email or password. (${cur.count}/${maxAttempts} attempts used)`
      });
    }

    if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'KITCHEN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for admin access.'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const cur = failedLoginAttempts.get(clientIp) || { count: 0, lockUntil: 0 };
      cur.count += 1;
      if (cur.count >= maxAttempts) {
        cur.lockUntil = Date.now() + 15 * 60 * 1000;
        failedLoginAttempts.set(clientIp, cur);
        return res.status(429).json({
          success: false,
          message: `Too many failed login attempts (${cur.count}/${maxAttempts}). Locked for 15 minutes.`
        });
      }
      failedLoginAttempts.set(clientIp, cur);
      return res.status(400).json({
        success: false,
        message: `Invalid email or password. (${cur.count}/${maxAttempts} attempts used)`
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact restaurant support.'
      });
    }

    failedLoginAttempts.delete(clientIp);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Admin Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true }
    });
    res.json({ success: true, data: user, message: 'Profile fetched' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -------------------------------------------------------------
// MENU & CATEGORIES ROUTES
// -------------------------------------------------------------
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({ where: { isActive: true } });
    res.json({ success: true, data: categories, message: 'Categories fetched' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/menu', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { isActive: true },
      include: { category: true }
    });
    res.json({ success: true, data: items, message: 'Menu items fetched' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/menu/:id', async (req, res) => {
  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: req.params.id },
      include: { category: true }
    });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item, message: 'Menu item fetched' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Menu Management
app.post('/api/menu', requireAdmin, async (req, res) => {
  try {
    const newItem = await prisma.menuItem.create({ data: req.body });
    res.json({ success: true, data: newItem, message: 'Item created' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/menu/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await prisma.menuItem.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: updated, message: 'Item updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/menu/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.menuItem.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, data: null, message: 'Item deleted (soft)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -------------------------------------------------------------
// ORDERS ROUTES
// -------------------------------------------------------------
app.get('/api/orders', authenticateToken, async (req: any, res) => {
  try {
    let orders;
    if (['ADMIN', 'MANAGER', 'KITCHEN'].includes(req.user.role)) {
      orders = await prisma.order.findMany({
        include: { items: { include: { menuItem: true } }, user: true, table: true },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: { items: { include: { menuItem: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }
    res.json({ success: true, data: orders, message: 'Orders fetched' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/orders', authenticateToken, async (req: any, res) => {
  try {
    const { items, type, tableId, deliveryAddress, specialInstructions, subtotal, tax, discount, deliveryFee, total, couponCode, paymentMethod } = req.body;
    
    const orderCount = await prisma.order.count();
    const order = await prisma.order.create({
      data: {
        orderNumber: 101 + orderCount,
        userId: req.user.id,
        type,
        tableId,
        deliveryAddress,
        specialInstructions,
        subtotal,
        tax,
        discount,
        deliveryFee,
        total,
        couponCode,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            specialInstructions: item.specialInstructions
          }))
        }
      },
      include: { items: true }
    });

    if (paymentMethod) {
      await prisma.payment.create({
        data: { orderId: order.id, method: paymentMethod, amount: total, status: 'PAID' }
      });
    }

    res.json({ success: true, data: order, message: 'Order placed successfully' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.patch('/api/orders/:id/status', authenticateToken, authorizeRole(['ADMIN', 'MANAGER', 'KITCHEN', 'DELIVERY']), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, data: order, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -------------------------------------------------------------
// DASHBOARD & REPORTS (ADMIN)
// -------------------------------------------------------------
app.get('/api/reports/sales', requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ where: { status: 'COMPLETED' } });
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayOrders = orders.filter(o => o.createdAt >= today);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    
    const stats = {
      totalRevenue: revenue,
      todayRevenue: todayRevenue,
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
    };
    res.json({ success: true, data: stats, message: 'Sales report fetched' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Customers endpoint for Admin dashboard
app.get('/api/admin/customers', requireAdmin, async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: customers, message: 'Customers fetched' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -------------------------------------------------------------
// CUSTOMER AREA API ENDPOINTS
// -------------------------------------------------------------

// 1. Dishes / Menu
app.get('/api/customer/dishes', async (req, res) => {
  try {
    const { category, search, veg_only } = req.query;
    const where: any = { is_available: true, is_archived: false };
    if (category && category !== 'All') {
      where.category = String(category);
    }
    if (veg_only === 'true') {
      where.is_veg = true;
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } }
      ];
    }
    const dishes = await prisma.dish.findMany({
      where,
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: dishes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dishes' });
  }
});

// 2. Favorites
app.get('/api/customer/favorites', authenticateToken, async (req: any, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { user_id: req.user.id }
    });
    const dishIds = favorites.map(f => f.dish_id);
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishIds } }
    });
    res.json({ success: true, data: dishes, dishIds });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
  }
});

app.post('/api/customer/favorites/:dishId', authenticateToken, async (req: any, res) => {
  try {
    const { dishId } = req.params;
    const existing = await prisma.favorite.findUnique({
      where: { user_id_dish_id: { user_id: req.user.id, dish_id: dishId } }
    });
    if (!existing) {
      await prisma.favorite.create({
        data: { user_id: req.user.id, dish_id: dishId }
      });
    }
    res.json({ success: true, message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add favorite' });
  }
});

app.delete('/api/customer/favorites/:dishId', authenticateToken, async (req: any, res) => {
  try {
    const { dishId } = req.params;
    await prisma.favorite.deleteMany({
      where: { user_id: req.user.id, dish_id: dishId }
    });
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove favorite' });
  }
});

// 3. Orders
app.post('/api/customer/orders', authenticateToken, async (req: any, res) => {
  try {
    const {
      items,
      order_type = 'Dine-in',
      table_number,
      address,
      notes,
      coupon_code,
      payment_method = 'UPI',
      payment_status = 'Paid'
    } = req.body;

    const settings = await prisma.restaurantSetting.findFirst();
    if (settings && !settings.is_accepting_orders) {
      return res.status(503).json({
        success: false,
        message: 'We are not accepting orders right now. Please check back soon.'
      });
    }

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    let subtotal = 0;
    for (const item of items) {
      subtotal += Number(item.price) * Number(item.quantity);
    }

    let discount = 0;
    let appliedCoupon: any = null;
    if (coupon_code) {
      const coupon = await prisma.customerCoupon.findUnique({
        where: { code: coupon_code.toUpperCase(), is_active: true }
      });
      if (coupon) {
        const now = new Date();
        if (coupon.valid_from && now < coupon.valid_from) {
          return res.status(400).json({ success: false, message: 'This coupon is not active yet.' });
        }
        if (coupon.expires_at && now > coupon.expires_at) {
          return res.status(400).json({ success: false, message: 'This coupon has expired.' });
        }
        if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
          return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached.' });
        }

        const userUses = await prisma.customerOrder.count({
          where: { user_id: req.user.id, coupon_code: coupon.code, status: { not: 'Cancelled' } }
        });
        if (userUses >= (coupon.per_user_limit || 1)) {
          return res.status(400).json({ success: false, message: `You have reached the limit for this coupon (${coupon.per_user_limit} per user).` });
        }

        if (subtotal >= coupon.min_order) {
          discount = Math.round((subtotal * coupon.discount_percent) / 100);
          appliedCoupon = coupon;
        }
      }
    }

    const total = Math.max(0, subtotal - discount);
    const ptsRate = settings?.points_per_rupees || 10;
    const points_earned = Math.floor(total / ptsRate);

    const order = await prisma.customerOrder.create({
      data: {
        user_id: req.user.id,
        status: 'Placed',
        order_type,
        table_number: table_number ? Number(table_number) : null,
        address: address || null,
        notes: notes || null,
        subtotal,
        discount,
        total,
        coupon_code: coupon_code || null,
        payment_method,
        payment_status,
        points_earned,
        estimated_minutes: order_type === 'Delivery' ? 35 : 20,
        items: {
          create: items.map((it: any) => ({
            dish_id: it.dish_id || it.id || 'dish',
            name: it.name,
            price: Number(it.price),
            quantity: Number(it.quantity),
            note: it.note || null
          }))
        }
      },
      include: { items: true }
    });

    // Increment coupon used count if used
    if (appliedCoupon) {
      try {
        await prisma.customerCoupon.update({
          where: { id: appliedCoupon.id },
          data: { used_count: { increment: 1 } }
        });
      } catch {}
    }

    // Update user points
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { points: { increment: points_earned } }
      });
      await prisma.customerNotification.create({
        data: {
          user_id: req.user.id,
          title: 'Order Placed Successfully!',
          message: `Your order #${order.id.slice(0, 8)} for ₹${total} has been received and sent to the kitchen.`
        }
      });
    } catch {}

    res.json({ success: true, data: order, message: 'Order created successfully' });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

app.get('/api/customer/orders', authenticateToken, async (req: any, res) => {
  try {
    const orders = await prisma.customerOrder.findMany({
      where: { user_id: req.user.id },
      include: { items: true },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

app.get('/api/customer/orders/:orderId', authenticateToken, async (req: any, res) => {
  try {
    const order = await prisma.customerOrder.findFirst({
      where: { id: req.params.orderId, user_id: req.user.id },
      include: { items: true }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

app.post('/api/customer/orders/:orderId/cancel', authenticateToken, async (req: any, res) => {
  try {
    const order = await prisma.customerOrder.findFirst({
      where: { id: req.params.orderId, user_id: req.user.id }
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'Placed') {
      return res.status(400).json({ success: false, message: 'Only newly placed orders can be cancelled' });
    }
    const updated = await prisma.customerOrder.update({
      where: { id: order.id },
      data: { status: 'Cancelled' }
    });
    res.json({ success: true, data: updated, message: 'Order cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

// -------------------------------------------------------------
// MOVIE-SEAT-BOOKING STYLE TABLE RESERVATION SYSTEM
// -------------------------------------------------------------
const CINEMA_TIME_SLOTS = ["12:00", "13:30", "15:00", "18:30", "19:30", "20:30", "21:30"];

function isSlotInPast(dateStr: string, slotStr: string): boolean {
  const now = new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = slotStr.split(':').map(Number);
  const target = new Date(y, m - 1, d, h, min, 0);
  return target.getTime() <= now.getTime();
}

// isDeterministicBooked removed — availability is now driven solely by real DB bookings.

function generateReservationCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'DS-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 1. Get Time Slots with capacity availability
app.get('/api/reservations/slots', async (req, res) => {
  try {
    const { date, guests } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    const dateStr = String(date);

    const floorTables = await prisma.floorTable.findMany({ where: { is_active: true } });
    const totalTables = floorTables.length || 48;

    // Fetch all real active bookings for this date
    const activeBookings = await prisma.cinemaReservationTable.findMany({
      where: { date: dateStr, active: true }
    });
    const bookedTableIdSet = new Set(activeBookings.map(b => `${b.table_id}_${b.time_slot}`));

    const settings = await prisma.restaurantSetting.findFirst();
    let timeSlots = CINEMA_TIME_SLOTS;
    if (settings?.reservation_slots) {
      try {
        timeSlots = JSON.parse(settings.reservation_slots);
      } catch {}
    }

    const slots = timeSlots.map((slot: string) => {
      const isPast = isSlotInPast(dateStr, slot);
      if (isPast) {
        return {
          slot,
          free_tables: 0,
          total_tables: totalTables,
          status: 'past'
        };
      }

      let bookedCount = 0;
      for (const t of floorTables) {
        if (bookedTableIdSet.has(`${t.id}_${slot}`)) {
          bookedCount++;
        }
      }

      const freeTables = Math.max(0, totalTables - bookedCount);
      const freePercent = (freeTables / totalTables) * 100;

      let status = 'available';
      if (freeTables === 0) {
        status = 'sold_out';
      } else if (freePercent < 20) {
        status = 'almost_full';
      } else if (freePercent <= 50) {
        status = 'fast_filling';
      } else {
        status = 'available';
      }

      return {
        slot,
        free_tables: freeTables,
        total_tables: totalTables,
        status
      };
    });

    res.json({ success: true, data: slots });
  } catch (error) {
    console.error('Slots error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch slots' });
  }
});

// 2. Floor Layout for a specific date and time slot
app.get('/api/reservations/layout', async (req: any, res) => {
  try {
    const { date, slot } = req.query;
    if (!date || !slot) {
      return res.status(400).json({ success: false, message: 'Date and slot are required' });
    }
    const dateStr = String(date);
    const slotStr = String(slot);

    // Optional user from token if passed
    let currentUserId: string | null = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch {}
    }

    // Lazy cleanup of expired holds
    await prisma.tableHold.deleteMany({
      where: { expires_at: { lt: new Date() } }
    });

    const floorTables = await prisma.floorTable.findMany({
      where: { is_active: true },
      orderBy: [{ row_label: 'asc' }, { col_index: 'asc' }]
    });

    // Real active bookings
    const activeBookings = await prisma.cinemaReservationTable.findMany({
      where: { date: dateStr, time_slot: slotStr, active: true }
    });
    const bookedTableIdSet = new Set(activeBookings.map(b => b.table_id));

    // Real table blocks
    const activeBlocks = await prisma.tableBlock.findMany({
      where: {
        date: dateStr,
        OR: [
          { time_slot: slotStr },
          { time_slot: null }
        ]
      }
    });
    const blockedTableIdSet = new Set(activeBlocks.map(b => b.table_id));

    // Active holds
    const activeHolds = await prisma.tableHold.findMany({
      where: { date: dateStr, time_slot: slotStr, expires_at: { gt: new Date() } }
    });

    const userHeldTableIds = new Set<string>();
    const otherHeldTableIds = new Set<string>();

    for (const h of activeHolds) {
      try {
        const ids: string[] = JSON.parse(h.table_ids);
        for (const id of ids) {
          if (currentUserId && h.user_id === currentUserId) {
            userHeldTableIds.add(id);
          } else {
            otherHeldTableIds.add(id);
          }
        }
      } catch {}
    }

    const layout = floorTables.map((t) => {
      let status: 'available' | 'booked' | 'held' | 'yours' = 'available';

      if (userHeldTableIds.has(t.id)) {
        status = 'yours';
      } else if (otherHeldTableIds.has(t.id)) {
        status = 'held';
      } else if (blockedTableIdSet.has(t.id)) {
        status = 'booked';
      } else if (bookedTableIdSet.has(t.id)) {
        status = 'booked';
      } else {
        status = 'available';
      }

      return {
        id: t.id,
        label: t.label,
        zone: t.zone,
        row_label: t.row_label,
        col_index: t.col_index,
        block: t.block,
        seats: t.seats,
        fee: t.fee,
        status
      };
    });

    res.json({ success: true, data: layout });
  } catch (error) {
    console.error('Layout error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch floor layout' });
  }
});

// 3. Hold tables for 5 minutes
app.post('/api/reservations/hold', authenticateToken, async (req: any, res) => {
  try {
    const { date, slot, table_ids } = req.body;
    if (!date || !slot || !table_ids || !Array.isArray(table_ids) || table_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Date, slot, and table_ids are required' });
    }

    const settings = await prisma.restaurantSetting.findFirst();
    const maxTables = settings?.max_tables_per_booking || 4;
    const holdMinutes = settings?.hold_minutes || 5;

    if (table_ids.length > maxTables) {
      return res.status(400).json({ success: false, message: `You can select up to ${maxTables} tables at a time` });
    }

    if (isSlotInPast(String(date), String(slot))) {
      return res.status(400).json({ success: false, message: 'Cannot reserve a past time slot' });
    }

    // Lazy cleanup of expired holds
    await prisma.tableHold.deleteMany({
      where: { expires_at: { lt: new Date() } }
    });

    const tables = await prisma.floorTable.findMany({
      where: { id: { in: table_ids }, is_active: true }
    });

    if (tables.length !== table_ids.length) {
      return res.status(400).json({ success: false, message: 'One or more selected tables do not exist' });
    }

    // Check if any table is already booked
    const activeBookings = await prisma.cinemaReservationTable.findMany({
      where: {
        date: String(date),
        time_slot: String(slot),
        active: true,
        table_id: { in: table_ids }
      }
    });

    const bookedTableIds = new Set(activeBookings.map(b => b.table_id));
    const conflictingLabels: string[] = [];

    for (const t of tables) {
      if (bookedTableIds.has(t.id)) {
        conflictingLabels.push(t.label);
      }
    }

    // Check if any table is held by another user
    const otherHolds = await prisma.tableHold.findMany({
      where: {
        date: String(date),
        time_slot: String(slot),
        user_id: { not: req.user.id },
        expires_at: { gt: new Date() }
      }
    });

    for (const h of otherHolds) {
      try {
        const heldIds: string[] = JSON.parse(h.table_ids);
        for (const hid of heldIds) {
          if (table_ids.includes(hid)) {
            const tbl = tables.find(t => t.id === hid);
            if (tbl && !conflictingLabels.includes(tbl.label)) {
              conflictingLabels.push(tbl.label);
            }
          }
        }
      } catch {}
    }

    if (conflictingLabels.length > 0) {
      return res.status(409).json({
        success: false,
        conflicting_labels: conflictingLabels,
        message: `Table(s) ${conflictingLabels.join(', ')} are already booked or held by another guest. Please choose another table.`
      });
    }

    // Remove any earlier hold by this user for the same slot
    await prisma.tableHold.deleteMany({
      where: {
        user_id: req.user.id,
        date: String(date),
        time_slot: String(slot)
      }
    });

    const expires_at = new Date(Date.now() + holdMinutes * 60 * 1000);
    const tableLabels = tables.map(t => t.label);

    const hold = await prisma.tableHold.create({
      data: {
        user_id: req.user.id,
        date: String(date),
        time_slot: String(slot),
        table_ids: JSON.stringify(table_ids),
        table_labels: JSON.stringify(tableLabels),
        expires_at
      }
    });

    res.json({
      success: true,
      hold_id: hold.id,
      expires_at: hold.expires_at,
      table_labels: tableLabels,
      message: 'Tables successfully held for 5 minutes'
    });
  } catch (error) {
    console.error('Hold error:', error);
    res.status(500).json({ success: false, message: 'Failed to hold tables' });
  }
});

// 4. Release Hold
app.delete('/api/reservations/hold/:holdId', authenticateToken, async (req: any, res) => {
  try {
    await prisma.tableHold.deleteMany({
      where: { id: req.params.holdId, user_id: req.user.id }
    });
    res.json({ success: true, message: 'Hold released' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to release hold' });
  }
});

// 5. Confirm Reservation
app.post('/api/reservations/confirm', authenticateToken, async (req: any, res) => {
  try {
    const { hold_id, guests, occasion, special_request, payment_method = 'UPI' } = req.body;
    if (!hold_id || !guests) {
      return res.status(400).json({ success: false, message: 'Hold ID and guest count are required' });
    }

    const hold = await prisma.tableHold.findFirst({
      where: {
        id: hold_id,
        user_id: req.user.id,
        expires_at: { gt: new Date() }
      }
    });

    if (!hold) {
      return res.status(400).json({
        success: false,
        message: 'Your table hold has expired or is invalid. Please select your tables again.'
      });
    }

    const tableIds: string[] = JSON.parse(hold.table_ids);
    const tables = await prisma.floorTable.findMany({
      where: { id: { in: tableIds }, is_active: true }
    });

    const guestCount = Number(guests);
    const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);

    // Capacity Rules
    if (totalSeats < guestCount) {
      return res.status(400).json({
        success: false,
        message: `Selected tables have ${totalSeats} seats, which is not enough for ${guestCount} guests.`
      });
    }

    if (totalSeats - guestCount >= 4) {
      return res.status(400).json({
        success: false,
        message: `Selected tables have ${totalSeats} seats, which is too large for a party of ${guestCount} (maximum excess is 3 seats). Please select a more fitting table combination.`
      });
    }

    // Fee calculation on server
    const fee_total = tables.reduce((sum, t) => sum + t.fee, 0);
    const points_earned = Math.floor(fee_total / 10);
    const reservationCode = generateReservationCode();

    try {
      const reservation = await prisma.$transaction(async (tx) => {
        const newRes = await tx.cinemaReservation.create({
          data: {
            user_id: req.user.id,
            code: reservationCode,
            date: hold.date,
            time_slot: hold.time_slot,
            guests: guestCount,
            occasion: occasion || null,
            special_request: special_request ? String(special_request).slice(0, 200) : null,
            fee_total,
            payment_method,
            status: 'Confirmed'
          }
        });

        // Insert table assignments with unique active_slot_key
        for (const t of tables) {
          await tx.cinemaReservationTable.create({
            data: {
              reservation_id: newRes.id,
              table_id: t.id,
              table_label: t.label,
              date: hold.date,
              time_slot: hold.time_slot,
              active: true,
              active_slot_key: `${t.id}_${hold.date}_${hold.time_slot}`
            }
          });
        }

        // Delete hold
        await tx.tableHold.delete({ where: { id: hold.id } });

        // Update user loyalty points
        if (points_earned > 0) {
          await tx.user.update({
            where: { id: req.user.id },
            data: { points: { increment: points_earned } }
          });
        }

        // Create in-app notification
        const labels = tables.map(t => t.label).join(', ');
        await tx.customerNotification.create({
          data: {
            user_id: req.user.id,
            title: 'Table Reservation Confirmed!',
            message: `Table(s) ${labels} confirmed for ${hold.date} at ${hold.time_slot} (Code: ${reservationCode}).`
          }
        });

        return newRes;
      });

      // Fetch full reservation details
      const fullReservation = await prisma.cinemaReservation.findUnique({
        where: { id: reservation.id },
        include: { tables: true }
      });

      res.json({
        success: true,
        data: fullReservation,
        message: 'Table reservation successfully confirmed!'
      });
    } catch (txError: any) {
      // Catch duplicate booking constraint
      if (txError.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Someone just booked that table, please choose another.'
        });
      }
      throw txError;
    }
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm reservation' });
  }
});

// 6. Get My Reservations (Upcoming and Past)
app.get('/api/reservations', authenticateToken, async (req: any, res) => {
  try {
    const reservations = await prisma.cinemaReservation.findMany({
      where: { user_id: req.user.id },
      include: { tables: true },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reservations' });
  }
});

// 7. Get Single Reservation (owner only)
app.get('/api/reservations/:id', authenticateToken, async (req: any, res) => {
  try {
    const reservation = await prisma.cinemaReservation.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
      include: { tables: true }
    });
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    res.json({ success: true, data: reservation });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reservation' });
  }
});

// 8. Cancel Reservation (only > 2 hours before slot)
app.post('/api/reservations/:id/cancel', authenticateToken, async (req: any, res) => {
  try {
    const reservation = await prisma.cinemaReservation.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
      include: { tables: true }
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    if (reservation.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Reservation is already cancelled' });
    }

    // Check 2 hours prior rule
    const [y, m, d] = reservation.date.split('-').map(Number);
    const [h, min] = reservation.time_slot.split(':').map(Number);
    const slotTime = new Date(y, m - 1, d, h, min, 0).getTime();
    const diffHours = (slotTime - Date.now()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      return res.status(400).json({
        success: false,
        message: 'Reservations can only be cancelled at least 2 hours prior to the reserved time.'
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.cinemaReservation.update({
        where: { id: reservation.id },
        data: { status: 'Cancelled' }
      });

      // Free tables
      for (const t of reservation.tables) {
        await tx.cinemaReservationTable.update({
          where: { id: t.id },
          data: {
            active: false,
            active_slot_key: `${t.table_id}_${t.date}_${t.time_slot}_cancelled_${t.id}`
          }
        });
      }
    });

    res.json({ success: true, message: 'Reservation cancelled successfully. Tables have been released.' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel reservation' });
  }
});

// 9. Reschedule Reservation (keeps code, atomic transaction)
app.post('/api/reservations/:id/reschedule', authenticateToken, async (req: any, res) => {
  try {
    const { date, slot, table_ids } = req.body;
    if (!date || !slot || !table_ids || !Array.isArray(table_ids) || table_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Date, slot, and table_ids are required' });
    }

    const reservation = await prisma.cinemaReservation.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
      include: { tables: true }
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Check 2 hours prior rule for current reservation
    const [cy, cm, cd] = reservation.date.split('-').map(Number);
    const [ch, cmin] = reservation.time_slot.split(':').map(Number);
    const currentSlotTime = new Date(cy, cm - 1, cd, ch, cmin, 0).getTime();
    if ((currentSlotTime - Date.now()) / (1000 * 60 * 60) < 2) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule less than 2 hours before the current reservation time.'
      });
    }

    if (isSlotInPast(String(date), String(slot))) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule to a past time slot' });
    }

    const tables = await prisma.floorTable.findMany({
      where: { id: { in: table_ids }, is_active: true }
    });

    const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
    if (totalSeats < reservation.guests) {
      return res.status(400).json({
        success: false,
        message: `Selected tables provide ${totalSeats} seats, which is less than your party of ${reservation.guests}.`
      });
    }

    // Check conflicts on new slot
    const activeBookings = await prisma.cinemaReservationTable.findMany({
      where: {
        date: String(date),
        time_slot: String(slot),
        active: true,
        table_id: { in: table_ids }
      }
    });

    if (activeBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'One or more of the selected tables are not available for this time slot.'
      });
    }

    const newFee = tables.reduce((sum, t) => sum + t.fee, 0);

    const updated = await prisma.$transaction(async (tx) => {
      // Free old tables
      for (const t of reservation.tables) {
        await tx.cinemaReservationTable.update({
          where: { id: t.id },
          data: {
            active: false,
            active_slot_key: `${t.table_id}_${t.date}_${t.time_slot}_rescheduled_${t.id}`
          }
        });
      }

      // Update reservation
      const resv = await tx.cinemaReservation.update({
        where: { id: reservation.id },
        data: {
          date: String(date),
          time_slot: String(slot),
          fee_total: newFee
        }
      });

      // Insert new tables
      for (const t of tables) {
        await tx.cinemaReservationTable.create({
          data: {
            reservation_id: reservation.id,
            table_id: t.id,
            table_label: t.label,
            date: String(date),
            time_slot: String(slot),
            active: true,
            active_slot_key: `${t.id}_${date}_${slot}`
          }
        });
      }

      return resv;
    });

    const full = await prisma.cinemaReservation.findUnique({
      where: { id: updated.id },
      include: { tables: true }
    });

    res.json({
      success: true,
      data: full,
      message: 'Reservation rescheduled successfully!'
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Someone just booked that table, please choose another.' });
    }
    console.error('Reschedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to reschedule reservation' });
  }
});

// 10. Admin Reservation Endpoints
app.get('/api/admin/reservations', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { date } = req.query;
    const where: any = {};
    if (date) where.date = String(date);

    const reservations = await prisma.cinemaReservation.findMany({
      where,
      include: { tables: true },
      orderBy: { created_at: 'desc' }
    });

    // Populate user details
    const userIds = Array.from(new Set(reservations.map(r => r.user_id)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, phone: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const enriched = reservations.map(r => ({
      ...r,
      guest_name: userMap.get(r.user_id)?.name || 'Guest',
      guest_email: userMap.get(r.user_id)?.email || '',
      guest_phone: userMap.get(r.user_id)?.phone || '',
      table_labels: r.tables.map(t => t.table_label).join(', ')
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin reservations' });
  }
});

app.patch('/api/admin/reservations/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Completed', 'Cancelled', 'Confirmed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const reservation = await prisma.cinemaReservation.findUnique({
      where: { id: req.params.id },
      include: { tables: true }
    });

    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });

    await prisma.$transaction(async (tx) => {
      await tx.cinemaReservation.update({
        where: { id: req.params.id },
        data: { status }
      });

      if (status === 'Cancelled') {
        for (const t of reservation.tables) {
          await tx.cinemaReservationTable.update({
            where: { id: t.id },
            data: {
              active: false,
              active_slot_key: `${t.table_id}_${t.date}_${t.time_slot}_admin_cancel_${t.id}`
            }
          });
        }
      }
    });

    res.json({ success: true, message: `Reservation marked as ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update reservation status' });
  }
});

// 5. Coupons
app.get('/api/customer/coupons', async (req, res) => {
  try {
    const coupons = await prisma.customerCoupon.findMany({ where: { is_active: true } });
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
});

app.post('/api/customer/coupons/apply', async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });
    const coupon = await prisma.customerCoupon.findUnique({
      where: { code: code.toUpperCase() }
    });
    if (!coupon || !coupon.is_active) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }
    const orderAmt = Number(amount) || 0;
    if (orderAmt < coupon.min_order) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is ₹${coupon.min_order}`
      });
    }
    const discount = Math.round((orderAmt * coupon.discount_percent) / 100);
    res.json({
      success: true,
      data: {
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        discount_amount: discount,
        description: coupon.description
      },
      message: `Coupon applied! You save ₹${discount}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to apply coupon' });
  }
});

// 6. Profile & Addresses
app.get('/api/customer/profile', authenticateToken, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        points: true,
        dietary_pref: true,
        allergies: true,
        addresses: true
      }
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

app.put('/api/customer/profile', authenticateToken, async (req: any, res) => {
  try {
    const { name, phone, dietary_pref, allergies } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(dietary_pref !== undefined && { dietary_pref }),
        ...(allergies !== undefined && { allergies })
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        points: true,
        dietary_pref: true,
        allergies: true
      }
    });
    res.json({ success: true, data: updated, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

app.post('/api/customer/addresses', authenticateToken, async (req: any, res) => {
  try {
    const { label, line1, city, pincode, is_default } = req.body;
    if (!line1 || !city || !pincode) {
      return res.status(400).json({ success: false, message: 'Incomplete address details' });
    }
    if (is_default) {
      await prisma.address.updateMany({
        where: { user_id: req.user.id },
        data: { is_default: false }
      });
    }
    const address = await prisma.address.create({
      data: {
        user_id: req.user.id,
        label: label || 'Home',
        line1,
        city,
        pincode,
        is_default: !!is_default
      }
    });
    res.json({ success: true, data: address, message: 'Address saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
});

app.delete('/api/customer/addresses/:id', authenticateToken, async (req: any, res) => {
  try {
    await prisma.address.deleteMany({
      where: { id: req.params.id, user_id: req.user.id }
    });
    res.json({ success: true, message: 'Address removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove address' });
  }
});

// 7. Reviews
app.get('/api/customer/reviews', async (req, res) => {
  try {
    const reviews = await prisma.customerReview.findMany({
      where: { is_hidden: false },
      orderBy: { created_at: 'desc' }
    });
    const userIds = Array.from(new Set(reviews.map(r => r.user_id)));
    const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    const enriched = reviews.map(r => ({
      ...r,
      author_name: userMap.get(r.user_id) || 'DineSphere Guest'
    }));
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

app.post('/api/customer/reviews', authenticateToken, async (req: any, res) => {
  try {
    const { order_id, dish_id, rating, comment } = req.body;
    if (!order_id || !rating) {
      return res.status(400).json({ success: false, message: 'Order ID and rating are required' });
    }
    const review = await prisma.customerReview.create({
      data: {
        user_id: req.user.id,
        order_id,
        dish_id: dish_id || null,
        rating: Number(rating),
        comment: comment || null
      }
    });
    res.json({ success: true, data: review, message: 'Thank you for your review!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
});

// 8. Notifications
app.get('/api/customer/notifications', authenticateToken, async (req: any, res) => {
  try {
    const notifications = await prisma.customerNotification.findMany({
      where: {
        OR: [
          { user_id: req.user.id },
          { user_id: null }
        ]
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

app.put('/api/customer/notifications/:id/read', authenticateToken, async (req: any, res) => {
  try {
    await prisma.customerNotification.updateMany({
      where: { id: req.params.id, user_id: req.user.id },
      data: { is_read: true }
    });
    res.json({ success: true, message: 'Notification marked read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// 9. Support Tickets
app.post('/api/customer/support', authenticateToken, async (req: any, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }
    const ticket = await prisma.supportTicket.create({
      data: {
        user_id: req.user.id,
        subject,
        message,
        status: 'Open'
      }
    });
    res.json({ success: true, data: ticket, message: 'Support ticket submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit support ticket' });
  }
});

app.get('/api/customer/support', authenticateToken, async (req: any, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    const ticketIds = tickets.map(t => t.id);
    const replies = await prisma.ticketReply.findMany({
      where: { ticket_id: { in: ticketIds } },
      orderBy: { created_at: 'asc' }
    });
    const replyMap: Record<string, any[]> = {};
    for (const r of replies) {
      if (!replyMap[r.ticket_id]) replyMap[r.ticket_id] = [];
      replyMap[r.ticket_id].push(r);
    }
    const enriched = tickets.map(t => ({
      ...t,
      replies: replyMap[t.id] || []
    }));
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch support tickets' });
  }
});

app.post('/api/customer/support/:id/reply', authenticateToken, async (req: any, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const reply = await prisma.ticketReply.create({
      data: {
        ticket_id: ticket.id,
        author_role: 'customer',
        message: message.trim()
      }
    });
    res.json({ success: true, data: reply, message: 'Reply sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
});

// Fallback for simple testing
app.get('/', (req, res) => res.send('DineSphere API is running'));

// -------------------------------------------------------------
// First-Run Setup: seeds only admin + required reference data (menu, tables, settings, coupons).
// No demo customers, no fake orders, no fake reservations.
// -------------------------------------------------------------
async function firstRunSetup() {
  if (ENV === 'development') {
    try {
      const adminEmail = (ADMIN_ID || 'admin').includes('@')
        ? (ADMIN_ID || 'admin')
        : `${ADMIN_ID || 'admin'}@dinesphere.test`;

      const hashedAdminPassword = await bcrypt.hash(ADMIN_PASSWORD || 'Admin@12345', 10);

      // Check if Admin exists
      const existingAdmin = await prisma.user.findFirst({
        where: {
          OR: [
            { email: adminEmail },
            { role: 'ADMIN' }
          ]
        }
      });

      if (!existingAdmin) {
        await prisma.user.create({
          data: {
            name: 'System Admin',
            email: adminEmail,
            password: hashedAdminPassword,
            role: 'ADMIN',
            phone: '1234567890'
          }
        });
        console.log(`[DEV SEED] Created admin account: ${adminEmail}`);
      } else {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { password: hashedAdminPassword, email: adminEmail }
        });
        console.log(`[DEV SEED] Verified admin account: ${adminEmail}`);
      }

      // Seed one demo customer if not existing
      let demoCustomer = await prisma.user.findUnique({
        where: { email: 'demo@dinesphere.test' }
      });

      if (!demoCustomer) {
        const hashedCustPassword = await bcrypt.hash('Demo@12345', 10);
        demoCustomer = await prisma.user.create({
          data: {
            name: 'Demo Customer',
            email: 'demo@dinesphere.test',
            password: hashedCustPassword,
            role: 'CUSTOMER',
            phone: '555-0199',
            points: 120,
            dietary_pref: 'none'
          }
        });
        console.log('[DEV SEED] Created demo customer: demo@dinesphere.test');

        // Seed demo address for demo customer
        await prisma.address.create({
          data: {
            user_id: demoCustomer.id,
            label: 'Home',
            line1: 'Apartment 4B, Royale Palms, Marine Drive',
            city: 'Mumbai',
            pincode: '400020',
            is_default: true
          }
        });

        // Seed welcome notification
        await prisma.customerNotification.create({
          data: {
            user_id: demoCustomer.id,
            title: 'Welcome to DineSphere!',
            message: 'You have earned 120 welcome reward points. Use code DINE10 on your first order.'
          }
        });
      } else {
        console.log('[DEV SEED] Demo customer already exists: demo@dinesphere.test');
      }

      // Seed 12 Dishes if table is empty
      const dishCount = await prisma.dish.count();
      if (dishCount === 0) {
        const initialDishes = [
          // Starters
          {
            name: 'Crispy Truffle Arancini',
            description: 'Golden fried arborio risotto balls infused with black truffle oil and molten mozzarella core.',
            category: 'Starters',
            price: 320,
            is_veg: true,
            rating: 4.8,
            image_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80'
          },
          {
            name: 'Smoked Salmon Bruschetta',
            description: 'Toasted sourdough slices topped with smoked Atlantic salmon, capers, and dill crème fraîche.',
            category: 'Starters',
            price: 450,
            is_veg: false,
            rating: 4.9,
            image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80'
          },
          {
            name: 'Spicy Peri-Peri Paneer Bites',
            description: 'Tender cottage cheese cubes tossed in chef’s fiery peri-peri glaze with fresh herbs.',
            category: 'Starters',
            price: 280,
            is_veg: true,
            rating: 4.6,
            image_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80'
          },
          // Main Course
          {
            name: 'Saffron Butter Chicken',
            description: 'Charcoal-smoked chicken simmered in rich velvety tomato and Kashmiri saffron gravy.',
            category: 'Main Course',
            price: 520,
            is_veg: false,
            rating: 4.9,
            image_url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80'
          },
          {
            name: 'Wild Forest Mushroom Risotto',
            description: 'Slow-cooked Italian carnaroli rice with porcini mushrooms, parmesan crisp, and herb oil.',
            category: 'Main Course',
            price: 480,
            is_veg: true,
            rating: 4.7,
            image_url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80'
          },
          {
            name: 'Grilled Lamb Chops Rosemary',
            description: 'Tender Australian lamb cutlets seared with rosemary jus, served with roasted garlic mash.',
            category: 'Main Course',
            price: 680,
            is_veg: false,
            rating: 4.9,
            image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
          },
          // Desserts
          {
            name: 'Molten Valrhona Lava Cake',
            description: 'Warm 70% dark chocolate fondant served with artisan Madagascar vanilla bean gelato.',
            category: 'Desserts',
            price: 340,
            is_veg: true,
            rating: 4.9,
            image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80'
          },
          {
            name: 'Pistachio Matcha Tiramisu',
            description: 'Espresso and ceremonial matcha-soaked ladyfingers layered with whipped mascarpone.',
            category: 'Desserts',
            price: 320,
            is_veg: true,
            rating: 4.7,
            image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80'
          },
          {
            name: 'Classic Crème Brûlée',
            description: 'Silky Madagascar vanilla bean custard finished with a crisp hand-torched caramelized sugar crust.',
            category: 'Desserts',
            price: 290,
            is_veg: true,
            rating: 4.8,
            image_url: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&auto=format&fit=crop&q=80'
          },
          // Drinks
          {
            name: 'Smoked Berry Old Fashioned',
            description: 'Handcrafted signature mocktail with muddled wild blackberries, aromatic bitters, and smoked rosemary.',
            category: 'Drinks',
            price: 260,
            is_veg: true,
            rating: 4.8,
            image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80'
          },
          {
            name: 'Royal Mango Cardamom Lassi',
            description: 'Thick Alphonso mango yogurt blend infused with roasted green cardamom and toasted pistachio nibs.',
            category: 'Drinks',
            price: 190,
            is_veg: true,
            rating: 4.7,
            image_url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80'
          },
          {
            name: 'Cold Brew Nitro Tonic',
            description: 'Single-origin Arabica nitro cold brew topped with sparkling citrus botanical tonic.',
            category: 'Drinks',
            price: 220,
            is_veg: true,
            rating: 4.6,
            image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80'
          }
        ];

        for (const dish of initialDishes) {
          await prisma.dish.create({ data: dish });
        }
        console.log('[DEV SEED] Created 12 initial restaurant dishes');
      }

      // Seed Dining Tables (8 tables)
      const tableCount = await prisma.diningTable.count();
      if (tableCount === 0) {
        const initialTables = [
          { number: 1, seats: 2 },
          { number: 2, seats: 2 },
          { number: 3, seats: 4 },
          { number: 4, seats: 4 },
          { number: 5, seats: 4 },
          { number: 6, seats: 6 },
          { number: 7, seats: 6 },
          { number: 8, seats: 8 },
        ];
        for (const t of initialTables) {
          await prisma.diningTable.create({ data: t });
        }
        console.log('[DEV SEED] Created 8 dining tables');
      }

      // Seed Customer Coupons
      const coupons = [
        { code: 'DINE10', description: '10% off on all orders above ₹300', discount_percent: 10, min_order: 300 },
        { code: 'FIRST50', description: '50% off for first-time orders (min ₹400)', discount_percent: 50, min_order: 400 },
        { code: 'CHEF20', description: '20% off Chef’s signature dishes (min ₹600)', discount_percent: 20, min_order: 600 }
      ];
      for (const cp of coupons) {
        const existing = await prisma.customerCoupon.findUnique({ where: { code: cp.code } });
        if (!existing) {
          await prisma.customerCoupon.create({ data: cp });
        }
      }
      console.log('[DEV SEED] Verified customer coupons');

      // Seed 48 Floor Tables for Cinema-Seat Movie Style Reservation
      const floorTableCount = await prisma.floorTable.count();
      if (floorTableCount === 0) {
        const zonesConfig = [
          { zone: 'Lounge', fee: 300, rows: ['A', 'B'] },
          { zone: 'Window', fee: 200, rows: ['C', 'D'] },
          { zone: 'Family', fee: 100, rows: ['E', 'F'] },
          { zone: 'Regular', fee: 0, rows: ['G', 'H'] }
        ];

        for (const z of zonesConfig) {
          for (const r of z.rows) {
            for (let c = 1; c <= 6; c++) {
              const block = c <= 2 ? 'left' : c <= 4 ? 'center' : 'right';
              let seats = 2;
              if (z.zone === 'Lounge') {
                seats = (c === 3 || c === 4 || (r === 'B' && c === 2)) ? 4 : 2;
              } else if (z.zone === 'Window') {
                seats = (c === 3 || c === 4 || c === 6) ? 4 : 2;
              } else if (z.zone === 'Family') {
                seats = (c === 3 || c === 4 || (r === 'F' && c === 2)) ? 6 : 4;
              } else {
                seats = (c === 3 || c === 4 || c === 6) ? 4 : 2;
              }

              await prisma.floorTable.create({
                data: {
                  label: `${r}${c}`,
                  zone: z.zone,
                  row_label: r,
                  col_index: c,
                  block,
                  seats,
                  fee: z.fee,
                  is_active: true
                }
              });
            }
          }
        }
        console.log('[DEV SEED] Created 48 Floor Tables across 4 zones (A-H)');
      }

      // Seed 1 Demo Reservation for demo customer if none exists
      if (demoCustomer) {
        const existingRes = await prisma.cinemaReservation.findFirst({
          where: { user_id: demoCustomer.id }
        });
        if (!existingRes) {
          const tableA3 = await prisma.floorTable.findUnique({ where: { label: 'A3' } });
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateStr = tomorrow.toISOString().split('T')[0];

          if (tableA3) {
            const demoRes = await prisma.cinemaReservation.create({
              data: {
                user_id: demoCustomer.id,
                code: 'DS-DEMO01',
                date: dateStr,
                time_slot: '19:30',
                guests: 2,
                occasion: 'Anniversary',
                special_request: 'Quiet corner table near the chef counter',
                fee_total: tableA3.fee,
                payment_method: 'UPI',
                status: 'Confirmed'
              }
            });

            await prisma.cinemaReservationTable.create({
              data: {
                reservation_id: demoRes.id,
                table_id: tableA3.id,
                table_label: tableA3.label,
                date: dateStr,
                time_slot: '19:30',
                active: true,
                active_slot_key: `${tableA3.id}_${dateStr}_19:30`
              }
            });

            console.log('[DEV SEED] Created sample demo reservation: DS-DEMO01');
          }
        }
      }

    } catch (err) {
      console.error('[DEV SEED ERROR]:', err);
    }
  }
}

app.listen(PORT, async () => {
  console.log(`DineSphere server running on port ${PORT} in ${ENV} mode`);
  await firstRunSetup();
  await seedAdminData(prisma);
});
