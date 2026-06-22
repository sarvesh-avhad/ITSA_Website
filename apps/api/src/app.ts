import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env, isProduction } from '@/config/env';
import { requestId } from '@/middleware/request-id.middleware';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import { apiRouter } from '@/routes';

const app = express();

// ============================================================
// Security Middleware
// ============================================================

// Helmet — security headers
app.use(
  helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
    exposedHeaders: ['X-Request-ID'],
  })
);

// Global rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // More lenient in dev
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      },
    },
  })
);

// ============================================================
// Body Parsing & Utilities
// ============================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ============================================================
// Request ID & Logging
// ============================================================

app.use(requestId);

// ============================================================
// Trust proxy (for Railway/Vercel)
// ============================================================

app.set('trust proxy', 1);

// ============================================================
// API Routes
// ============================================================

app.use(`/api/${env.API_VERSION}`, apiRouter);

// ============================================================
// Error Handling
// ============================================================

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
