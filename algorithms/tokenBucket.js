const client = require('../redisClient');

const tokenBucket = async (key, limit, refillRate) => {
    const tokensKey = `tokens:${key}`;
    const lastRefillKey = `lastRefill:${key}`;

    let currentTokens = await client.v4.get(tokensKey);
    console.log('currentTokens - ' + currentTokens)
    
    
    // Check if the user is new or the token value is null
    if (currentTokens == null) {
        // Initialize new user with full bucket (limit tokens) and current time as last refill
        console.log('New user detected, initializing token bucket with full tokens.');

        await client.v4.set(tokensKey, limit);
        await client.v4.set(lastRefillKey, Date.now());

        currentTokens = limit;  // Assume full tokens for this request
    } else {
        currentTokens = parseInt(currentTokens);
    }

    // Fetch last refill time
    let lastRefill = await client.v4.get(lastRefillKey);
    lastRefill = lastRefill != null ? parseInt(lastRefill) : Date.now();

    // Calculate tokens based on the time since last refill
    const timeSinceLastRefill = (Date.now() - lastRefill) / 1000;
    const newTokens = Math.min(limit, currentTokens + Math.floor(timeSinceLastRefill * refillRate));

    console.log(`Current Tokens: ${currentTokens}, New Tokens: ${newTokens}, Time Since Last Refill: ${timeSinceLastRefill}`);

    // Check if there are tokens available for the request
    if (newTokens > 0) {
        await client.v4.set(tokensKey, newTokens - 1);  // Decrease token by 1
        await client.v4.set(lastRefillKey, Date.now()); // Update last refill time
        return true; // Request allowed
    } else {
        console.log(`Warning user ${key} for exceeding rate limit.`);
        return false; // Rate limit exceeded
    }
};


module.exports = tokenBucket;
