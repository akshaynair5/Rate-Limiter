const redis = require('redis');
const client = redis.createClient();

// Import the algorithms
const tokenBucket = require('./algorithms/tokenBucket');
const slidingWindow = require('./algorithms/slidingWindow');
const leakyBucket = require('./algorithms/leakyBucket');

const rateLimiter = (algorithm, defaultLimitConfig) => {
    return async (req, res, next) => {
      const userId = req.user.id || req.ip; // Unique user or IP
      const excessCount = await client.getAsync(`excessRequests:${userId}`) || 0;
  
      // Get adjusted rate limits based on the reputation system
      const { limit, windowInSeconds } = await adjustRateLimits(userId, excessCount);
  
      let allowed = false;
      switch (algorithm) {
        case 'tokenBucket':
          allowed = await tokenBucket(userId, limit, defaultLimitConfig.refillRate, windowInSeconds);
          break;
        case 'slidingWindow':
          allowed = await slidingWindow(userId, limit, windowInSeconds);
          break;
        case 'leakyBucket':
          allowed = await leakyBucket(userId, limit, defaultLimitConfig.ratePerSecond);
          break;
        default:
          return res.status(400).json({ message: 'Invalid rate-limiting algorithm' });
      }
  
      if (allowed) {
        // Reset excess request count if the user is allowed
        await client.del(`excessRequests:${userId}`);
        next(); // Allow the request
      } else {
        // Track excess requests and warn the user
        await trackExcessRequests(userId);
        await warnUser(userId);
        res.status(429).json({ message: 'Rate limit exceeded, but you have more chances!' });
      }
    };
  };
  
  
module.exports = rateLimiter;
