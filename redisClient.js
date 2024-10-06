const { createClient } = require('redis');

let client; // Redis client reference

const redisConfig = async ({ host, port }) => {
    if (!client) {
        client = createClient({ url: `redis://${host}:${port}` , legacyMode: true });
        
        client.on('error', (err) => console.log('Redis Client Error', err));
        
        await client.connect(); // Ensure Redis connection
        console.log('Connected to Redis');
    }
    return client;
};

// Export the client and the configuration function
module.exports = { redisConfig, client };
