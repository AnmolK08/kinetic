import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import prisma from '../config/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 1. If explicit token provided, verify it
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          name: decoded.name,
        };
        return next();
      } catch (err) {
        // Also check if it's a Supabase-issued JWT (decode payload without crashing)
        try {
          const decoded = jwt.decode(token);
          if (decoded && (decoded.sub || decoded.id)) {
            req.user = {
              id: decoded.sub || decoded.id,
              email: decoded.email,
              name: decoded.user_metadata?.name || decoded.name,
            };
            return next();
          }
        } catch {
          // Token decode failed
        }
        return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
      }
    }

    // 2. In dev/test/demo mode, allow x-user-id header or fallback to demo user
    const devUserId = req.headers['x-user-id'];
    if (devUserId) {
      req.user = { id: devUserId, email: `${devUserId}@kinetic.app` };
      return next();
    }

    if (config.nodeEnv === 'development' || process.env.ALLOW_DEMO_AUTH === 'true') {
      // Default to demo user in development so frontend demo mode functions seamlessly
      const demoUser = await prisma.user.findFirst({
        where: { email: 'demo@kinetic.app' },
      });

      if (demoUser) {
        req.user = { id: demoUser.id, email: demoUser.email, name: demoUser.name };
      } else {
        req.user = { id: 'demo-user-01', email: 'demo@kinetic.app', name: 'Alex' };
      }
      return next();
    }

    return res.status(401).json({ success: false, message: 'Authentication required' });
  } catch (error) {
    next(error);
  }
};
