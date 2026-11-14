const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const logger = require('./config/logger');
const authRoutes = require('./modules/auth/auth.routes');
const catalogRoutes = require('./modules/catalog/catalog.routes');
const bookingRoutes = require('./modules/bookings/booking.routes');
const addressRoutes = require('./modules/addresses/address.routes');
const providerRoutes = require('./modules/providers/provider.routes');
const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');
const { success } = require('./utils/api-response');
const { sequelize } = require('./models');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()),
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(pinoHttp({
  logger,
  genReqId: () => crypto.randomUUID(),
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req(req) {
      return { id: req.id, method: req.method, url: req.url };
    }
  }
}));

app.get('/health', (req, res) => success(res, { status: 'ok' }, { message: 'Liveness check passed' }));
app.get('/health/ready', async (req, res, next) => {
  try {
    await sequelize.authenticate();
    return success(res, { status: 'ready' }, { message: 'Readiness check passed' });
  } catch (error) {
    return next(error);
  }
});

app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/catalog`, catalogRoutes);
app.use(`${env.API_PREFIX}/bookings`, bookingRoutes);
app.use(`${env.API_PREFIX}/addresses`, addressRoutes);
app.use(`${env.API_PREFIX}/providers`, providerRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
