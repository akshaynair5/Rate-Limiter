const express = require('express');
const { redisConfig } = require('./redisClient');
const rateLimiter = require('./rate-limiter');

const app = express();
const PORT = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
    req.user = { id: 'user123' }; // Simulate a logged-in user
    next();
};

app.use(mockAuth);

// Configure Redis connection (Make sure Redis is initialized before any route is called)
const redisSetUp = { host: 'localhost', port: 6379 };

redisConfig(redisSetUp).then((client) => {
    // Example routes with rate limiter
    app.get('/api/resource', rateLimiter('tokenBucket', { limit: 10, refillRate: 1, windowInSeconds: 60 ,client}), (req, res) => {
        res.send('This is a rate-limited resource!');
    });

    app.get('/api/data', rateLimiter('slidingWindow', { limit: 5, windowInSeconds: 60 ,client}), (req, res) => {
        res.send('This is another rate-limited resource!');
    });

    app.post('/api/upload', rateLimiter('leakyBucket', { capacity: 10, period: 50, leaksPerPeriod: 5, requestExpiryInSeconds: 90, client }), (req, res) => {
        res.send('This is a rate-limited resource!');
    });

    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize Redis:', err);
    process.exit(1); // Exit the app if Redis fails to connect
});
