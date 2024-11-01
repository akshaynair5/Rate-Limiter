const leakyBucket = async (userId, capacity, period, leaksPerPeriod, requestExpiryInSeconds, client) => {
    const keyForUser = `leakyBucket:${userId}`;
    const lastLeakTimeKey = `lastLeakTime:${userId}`;

    // Fetch current bucket size and last leak time
    let currentBucketSize = await client.v4.get(keyForUser);
    let lastLeakTime = await client.v4.get(lastLeakTimeKey);

    // Initialize the bucket for new users if not present
    if (currentBucketSize == null) {
        console.log('New user detected, setting up Leaky Bucket');
        currentBucketSize = 0; // Start with an empty bucket
        lastLeakTime = Date.now();
        await client.v4.set(keyForUser, currentBucketSize);
        await client.v4.set(lastLeakTimeKey, lastLeakTime);
    } else {
        currentBucketSize = parseInt(currentBucketSize);
        lastLeakTime = parseInt(lastLeakTime);
    }

    const now = Date.now();
    const elapsedTime = (now - lastLeakTime) / 1000; // Convert to seconds
    const elapsedPeriods = Math.floor(elapsedTime / period);

    // Calculate the number of leaks
    const leaks = elapsedPeriods * leaksPerPeriod;
    
    // Apply leaks if there are any
    if (leaks > 0) {
        currentBucketSize = Math.max(0, currentBucketSize - leaks);
        lastLeakTime = now; // Reset the last leak time to now after applying leaks
        await client.v4.set(keyForUser, currentBucketSize);
        await client.v4.set(lastLeakTimeKey, lastLeakTime);
    }

    // Check if the request can be processed (i.e., there is capacity)
    if (currentBucketSize < capacity) {
        // Increment bucket size for this request
        await client.v4.set(keyForUser, currentBucketSize + 1);
        console.log(currentBucketSize)
        await client.v4.expire(keyForUser, requestExpiryInSeconds);
        
        return true; // Request allowed
    } else {
        return false; // Rate limit exceeded
    }
};

module.exports = leakyBucket;
