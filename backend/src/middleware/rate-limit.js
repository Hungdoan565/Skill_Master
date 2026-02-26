import rateLimit from 'express-rate-limit';

const DEFAULT_MESSAGE = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
const DEFAULT_SKIP_PATHS = ['/health', '/api/health'];

const normalizeMethods = (methods = []) => methods.map((method) => method.toUpperCase());

export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 60 * 1000,
    max = 100,
    methods,
    message = DEFAULT_MESSAGE,
    skipPaths = DEFAULT_SKIP_PATHS,
    keyGenerator = (req) => req.ip,
    ...rest
  } = options;

  const excludedPaths = new Set(skipPaths);
  const allowedMethods = methods ? new Set(normalizeMethods(methods)) : null;

  return rateLimit({
    windowMs,
    max,
    keyGenerator,
    standardHeaders: false,
    legacyHeaders: true,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message,
      });
    },
    skip: (req) => {
      if (excludedPaths.has(req.path)) {
        return true;
      }

      if (allowedMethods && !allowedMethods.has(req.method.toUpperCase())) {
        return true;
      }

      return false;
    },
    ...rest,
  });
};

export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
});

export const writeLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
});

export const readLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  methods: ['GET'],
});
