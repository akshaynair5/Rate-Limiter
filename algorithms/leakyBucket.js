const leakyBucket = async (userId, capacity, period, leaksPerPeriod, requestExpiryInSeconds,client) => {

    const keyForUser = `leakyBucket:${userId}`;
    const lastLeakTimeKey = `lastLeakTime:${userId}`;


    // Fetch the current water level and the last leak timestamp from Redis
    let currentBucketSize = await client.v4.get(keyForUser);
    let lastLeakTime = await client.v4.get(lastLeakTimeKey);

    // Initialize the bucket for new users
    if (currentBucketSize == null) {
        console.log('New user detected, setting up Leaky Bucket');
        currentBucketSize = 0; // Start with an empty bucket
        await client.v4.set(keyForUser, currentBucketSize);
        await client.v4.set(lastLeakTimeKey, Date.now());
    }

    currentBucketSize = parseInt(currentBucketSize);
    lastLeakTime = lastLeakTime ? parseInt(lastLeakTime) : Date.now();
    // Calculate the elapsed time since the last leak
    const now = Date.now() / 1000;
    const elapsedTime = now - lastLeakTime;
    const elapsedPeriods = Math.floor(elapsedTime / period);
    const leaks = elapsedPeriods * leaksPerPeriod;

    console.log(leaks)
    console.log(elapsedPeriods + ' - ' + leaksPerPeriod)

    // Refill the bucket based on the leaks
    if (leaks > 0) {
        currentBucketSize = Math.max(0, currentBucketSize - leaks);
        await client.v4.set(keyForUser, currentBucketSize);
        await client.v4.set(lastLeakTimeKey, now);
    }


    // Check if a request can be processed (bucket has available space)
    if (currentBucketSize < capacity) {

        // Update the bucket size in Redis
        await client.v4.set(keyForUser, currentBucketSize + 1);
        // await client.v4.expire(keyForUser, requestExpiryInSeconds); // Set expiry for the bucket
        await client.v4.set(lastLeakTimeKey, now); // Update the last leak time

        return true; // Request allowed
    } else {
        return false; // Rate limit exceeded
    }
};

module.exports = leakyBucket;
