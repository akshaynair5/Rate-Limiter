const redis = require('redis');
const client = redis.createClient();

const tokenBucket = async (key, limit, refillRate, windowInSeconds) => {
  const tokensKey = `tokens:${key}`;
  const lastRefillKey = `lastRefill:${key}`;

  const currentTokens = await client.getAsync(tokensKey) || limit;
  const lastRefill = await client.getAsync(lastRefillKey) || Date.now();

  const timeSinceLastRefill = (Date.now() - lastRefill) / 1000;
  const newTokens = Math.min(limit, parseInt(currentTokens) + Math.floor(timeSinceLastRefill * refillRate));

  if (newTokens > 0) {
    await client.set(tokensKey, newTokens - 1);  // Decrease token by 1
    await client.set(lastRefillKey, Date.now()); // Update last refill time
    return true; // Request allowed
  } else {
    return false; // Rate limit exceeded
  }
};

module.exports = tokenBucket;
