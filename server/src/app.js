const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const catalogRoutes = require('./modules/catalog/catalog.routes');
const bookingRoutes = require('./modules/bookings/booking.routes');
const addressRoutes = require('./modules/addresses/address.routes');
const providerRoutes = require('./modules/providers/provider.routes');
const settingsRoutes = require('./modules/settings/settings.routes');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const { success } = require('./utils/api-response');
const { sequelize } = require('./models');


const app = express();


const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.disable('x-powered-by');

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));
app.use('/urbanmate/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  next();
});

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get(['/health', '/health/live'], (req, res) => success(res, { status: 'ok' }, { message: 'Liveness check passeddd' }));
app.get('/health/ready', async (req, res, next) => {
  try {
    await sequelize.authenticate();
    return success(res, { status: 'ready' }, { message: 'Readiness check passedddd' });
  } catch (error) {
    return next(error);
  }
});

app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/catalog`, catalogRoutes);
app.use(`${env.API_PREFIX}/bookings`, bookingRoutes);
app.use(`${env.API_PREFIX}/addresses`, addressRoutes);
app.use(`${env.API_PREFIX}/providers`, providerRoutes);
app.use(`${env.API_PREFIX}/settings`, settingsRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
