const tokenBucket = async (key, limit, refillRate, client) => {
    const tokensKey = `tokens:${key}`;
    const lastRefillKey = `lastRefill:${key}`;

    // Fetch current token count and last refill time from the datastore
    let currentTokens = await client.v4.get(tokensKey);
    let lastRefill = await client.v4.get(lastRefillKey);
    
    // Initialize if user is new
    if (currentTokens == null || lastRefill == null) {
        console.log('New user detected, initializing token bucket with full tokens.');
        currentTokens = limit;  // Start with full capacity
        lastRefill = Date.now(); // Set last refill to now
        await client.v4.set(tokensKey, currentTokens);
        await client.v4.set(lastRefillKey, lastRefill);
    } else {
        currentTokens = parseInt(currentTokens);
        lastRefill = parseInt(lastRefill);
    }

    // Calculate tokens based on time elapsed since last refill
    const timeSinceLastRefill = (Date.now() - lastRefill) / 1000; // in seconds
    const tokensToAdd = timeSinceLastRefill > refillRate? limit : 0;
    
    // Update token count, ensuring we do not exceed the limit
    currentTokens = Math.min(limit, currentTokens + tokensToAdd);

    // Only update `lastRefillKey` if we actually added tokens
    if (tokensToAdd > 0) {
        await client.v4.set(tokensKey, currentTokens);
        await client.v4.set(lastRefillKey, Date.now());
    }

    console.log(`Current Tokens: ${currentTokens}, Tokens Added: ${tokensToAdd}, Time Since Last Refill: ${timeSinceLastRefill}`);

    // Check if we have tokens available for this request
    if (currentTokens > 0) {
        // Consume 1 token
        await client.v4.set(tokensKey, currentTokens - 1); 
        return true; // Request allowed
    } else {
        console.log(`Warning user ${key} for exceeding rate limit.`);
        return false; // Rate limit exceeded
    }
};

module.exports = tokenBucket;
