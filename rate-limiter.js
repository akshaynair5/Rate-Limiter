// Import Redis client and algorithms
const tokenBucket = require('./algorithms/tokenBucket');
const slidingWindow = require('./algorithms/slidingWindow');
const leakyBucket = require('./algorithms/leakyBucket');

const rateLimiter = (algorithm, defaultLimitConfig) => {
    return async (req, res, next) => {
        const client = defaultLimitConfig.client;

        try {
            // Ensure Redis client is connected
            if (!client) {
                return res.status(503).json({ message: 'Redis client is not available' });
            }

            const userId = req.user?.id || req.ip; // Unique user or IP

            let allowed = false;
            switch (algorithm) {
                case 'tokenBucket':
                    allowed = await tokenBucket(userId, defaultLimitConfig.limit, defaultLimitConfig.refillRate, defaultLimitConfig.windowInSeconds, client);
                    break;
                case 'slidingWindow':
                    allowed = await slidingWindow(userId, defaultLimitConfig.limit, defaultLimitConfig.windowInSeconds, client);
                    break;
                case 'leakyBucket':
                    allowed = await leakyBucket(userId, defaultLimitConfig.capacity, defaultLimitConfig.period, defaultLimitConfig.leaksPerPeriod, defaultLimitConfig.requestExpiryInSeconds, client);
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid rate-limiting algorithm' });
            }

            if (allowed) {
                next();
            } else {
                res.status(429).json({ message: 'Rate limit exceeded' });
            }
        } catch (error) {
            console.error('Error in rate limiter:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};

module.exports = rateLimiter;
