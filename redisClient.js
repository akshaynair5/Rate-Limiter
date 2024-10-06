// redisClient.js
const { createClient } = require('redis');

// Create and configure Redis client
const client = createClient({
    url: 'redis://localhost:6379',
    legacyMode: true // Enable legacy mode for backward compatibility
});

// Connect to Redis server when the application starts
(async () => {
    try {
        await client.connect(); // Explicitly connect to Redis
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Redis connection error:', err);
    }

    client.on('error', (error) => console.error(`Redis Client Error: ${error}`));
    client.on('ready', () => console.log('Redis client is ready'));
})();

// Export the Redis client for use in other modules
module.exports = client;
