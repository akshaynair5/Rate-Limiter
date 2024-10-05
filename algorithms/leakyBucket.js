const redis = require('redis');
const client = redis.createClient();

const leakyBucket = async (key, limit, ratePerSecond) => {
  const keyForUser = `leakyBucket:${key}`;
  const lastRequestTimeKey = `lastRequest:${key}`;

  const lastRequestTime = await client.getAsync(lastRequestTimeKey) || Date.now();
  const timeSinceLast = (Date.now() - lastRequestTime) / 1000;

  const allowedRequests = Math.floor(timeSinceLast * ratePerSecond);
  const currentBucket = Math.min(limit, parseInt(allowedRequests));

  if (currentBucket > 0) {
    await client.set(lastRequestTimeKey, Date.now());
    return true; // Request allowed
  } else {
    return false; // Rate limit exceeded
  }
};

module.exports = leakyBucket;
