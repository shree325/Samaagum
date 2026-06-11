import express from 'express';
import dotenv from 'dotenv';
import pool from './config/database';

// Route imports
import entityRoutes from './routes/entity.routes';
import groupRoutes from './routes/group.routes';
import rbacRoutes from './routes/rbac.routes';
import userRoutes from './routes/user.routes';
import tenantRoutes from './routes/tenant.routes';
import profileRoutes from './routes/profile.routes';
import eventRoutes from './routes/event.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import checkinRoutes from './routes/checkin.routes';
import formRoutes from './routes/form.routes';
import messagingRoutes from './routes/messaging.routes';
import connectionRoutes from './routes/connection.routes';
import forumRoutes from './routes/forum.routes';
import subscriptionRoutes from './routes/subscription.routes';
import couponRoutes from './routes/coupon.routes';
import mediaRoutes from './routes/media.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Basic health check route
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: 'Samaagum Backend is running and database is connected.',
      dbTime: result.rows[0].now
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// ─── Route Registration ─────────────────────────────────────────────
// Core & Identity
app.use('/tenants', tenantRoutes);
app.use('/users', userRoutes);
app.use('/profiles', profileRoutes);
app.use('/entities', entityRoutes);
app.use('/groups', groupRoutes);
app.use('/rbac', rbacRoutes);

// Events & Ticketing
app.use('/events', eventRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);
app.use('/checkins', checkinRoutes);
app.use('/coupons', couponRoutes);

// Content & Social
app.use('/forms', formRoutes);
app.use('/media', mediaRoutes);
app.use('/forums', forumRoutes);
app.use('/conversations', messagingRoutes);
app.use('/connections', connectionRoutes);

// Platform
app.use('/subscriptions', subscriptionRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
  console.log(`📚 Registered route modules: 17`);
});
