const client = require('../redisClient');

const leakyBucket = async (key, limit, ratePerSecond) => {
    const keyForUser = `leakyBucket:${key}`;
    const lastRequestTimeKey = `lastRequest:${key}`;

    // Fetch the last request time from Redis
    let currentBucketSize = await client.v4.get(keyForUser); 
    let lastRequestTime = await client.v4.get(lastRequestTimeKey);



    lastRequestTime = lastRequestTime ? parseInt(lastRequestTime) : Date.now();

    // Calculate time since the last request
    const timeSinceLast = (Date.now() - lastRequestTime) / 1000;

    // Calculate the maximum allowed requests based on the time passed
    const allowedRequests = Math.floor(timeSinceLast * ratePerSecond);

    // Fetch the current bucket size from Redis
    let currentBucket = await client.v4.get(keyForUser);
    currentBucket = currentBucket ? parseInt(currentBucket) : 0; // Initialize to 0 if not present

    // Update the current bucket with the allowed requests
    currentBucket = Math.min(limit, currentBucket + allowedRequests);
    console.log('currentBucket' + currentBucket)

    // Check if a request can be made
    if (currentBucket > 0) {
        currentBucket--; // Decrement the bucket for the allowed request
        await client.v4.set(keyForUser, currentBucket); // Update the bucket in Redis
        await client.v4.set(lastRequestTimeKey, Date.now()); // Update the last request time
        return true; // Request allowed
    } else {
        return false; // Rate limit exceeded
    }
};

module.exports = leakyBucket;
