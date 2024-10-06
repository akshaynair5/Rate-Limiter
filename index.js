const client = require('./redisClient');

// Import your algorithms
const tokenBucket = require('./algorithms/tokenBucket');
const slidingWindow = require('./algorithms/slidingWindow');
const leakyBucket = require('./algorithms/leakyBucket');
const reputationSystem = require('./algorithms/reputationSystem');

// Middleware for rate limiting
const rateLimiter = (algorithm, defaultLimitConfig) => {
    return async (req, res, next) => {
        try {
            if (!client.isOpen) { // Check if client is connected
                return res.status(503).json({ message: 'Redis client is not connected' });
            }

            const userId = req.user?.id || req.ip; // Unique user or IP
            const excessCount = parseInt(await client.get(`excessRequests:${userId}`)) || 0;

            // Get adjusted rate limits based on the reputation system
            // const { limit, windowInSeconds } = await reputationSystem.adjustRateLimits(userId, excessCount);
            let limit = defaultLimitConfig.limit;

            let allowed = false;
            switch (algorithm) {
                case 'tokenBucket':
                    allowed = await tokenBucket(userId, defaultLimitConfig.limit, defaultLimitConfig.refillRate, defaultLimitConfig.windowInSeconds);
                    break;
                case 'slidingWindow':
                    allowed = await slidingWindow(userId, limit, defaultLimitConfig.windowInSeconds);
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
                res.status(429).json({ message: 'Rate limit exceeded' });
            }
        } catch (error) {
            console.error('Error in rate limiter:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};

// Track excess requests (You can implement this logic based on your requirements)
const trackExcessRequests = async (userId) => {
    const excessCount = parseInt(await client.get(`excessRequests:${userId}`)) || 0;
    await client.set(`excessRequests:${userId}`, excessCount + 1);
};

// Warn user (You can implement custom logic here for notifications)
const warnUser = async (userId) => {
    console.log(`Warning user ${userId} for exceeding rate limit`);
};

// Graceful shutdown function to close Redis connection on exit
const shutdown = async () => {
    if (client.isOpen) {
        try {
            await client.quit(); // Ensure the client is closed properly
            console.log('Disconnected from Redis');
        } catch (error) {
            console.error('Error during Redis disconnection:', error);
        }
    }
    process.exit(0); // Ensure the process exits
};

// Handle process termination signals (CTRL+C)
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Export the rate limiter middleware
module.exports = rateLimiter;