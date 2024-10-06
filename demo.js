const express = require('express');
const rateLimiter = require('./index.js');

// Import the algorithm
const app = express();
const PORT = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
    req.user = { id: 'user123' }; // Simulate a logged-in user
    next();
};

// Use the mock authentication middleware
app.use(mockAuth);

// Example routes with rate limiter
app.get('/api/resource', rateLimiter('tokenBucket', { limit: 10, refillRate: 1,windowInSeconds: 60 }), (req, res) => {
    res.send('This is a rate-limited resource!');
});

app.get('/api/data', rateLimiter('slidingWindow', { limit: 5,windowInSeconds: 60 }), (req, res) => {
    res.send('This is another rate-limited resource!');
});

app.post('/api/upload', rateLimiter('leakyBucket', { limit: 5, ratePerSecond: 1 }), (req, res) => {
    res.send('This is a rate-limited upload endpoint!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});