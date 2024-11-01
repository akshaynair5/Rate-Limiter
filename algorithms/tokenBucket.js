const tokenBucket = async (key, limit, client) => {
    const tokensKey = `tokens:${key}`;
    let currentTokens = await client.v4.get(tokensKey);

    // Initialize if the user is new
    if (currentTokens == null) {
        console.log('New user detected, initializing token bucket with full tokens.');
        currentTokens = limit;  // Start with full capacity
        lastRefill = Date.now(); // Set last refill to now
        await client.v4.set(tokensKey, currentTokens);
    } else {
        currentTokens = parseInt(currentTokens);
    }
    if (currentTokens > 0) {
        await client.v4.set(tokensKey, currentTokens-1);
    }

    console.log(`Current Tokens: ${currentTokens - 1}`);

    // Check if tokens are available for this request
    return currentTokens - 1 > 0; // Return true if request is allowed, false otherwise
};

// Function to increase the token count after request completion
const consumeToken = async (key, limit, client) => {
    const tokensKey = `tokens:${key}`;

    let currentTokens = await client.v4.get(tokensKey);
    if (currentTokens != null) {
        currentTokens = parseInt(currentTokens);
        if (currentTokens < limit) {
            await client.v4.set(tokensKey, currentTokens + 1);
        }
    }
};

module.exports = { tokenBucket, consumeToken };
