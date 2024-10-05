const redis = require('redis');
const client = redis.createClient();

const slidingWindow = async (key, limit, windowInSeconds) => {
  const now = Date.now();
  const windowStart = now - (windowInSeconds * 1000);
  const keyForUser = `requests:${key}`;

  // Remove old requests
  await client.zremrangebyscore(keyForUser, 0, windowStart);

  // Get current count of requests
  const requestCount = await client.zcard(keyForUser);

  if (requestCount < limit) {
    // Add new request with the current timestamp
    await client.zadd(keyForUser, now, now);
    await client.expire(keyForUser, windowInSeconds);
    return true; // Request allowed
  } else {
    return false; // Rate limit exceeded
  }
};

module.exports = slidingWindow;
