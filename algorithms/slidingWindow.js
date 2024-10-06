const slidingWindow = async (key, limit, windowInSeconds,client) => {

  const now = Date.now();
  const windowStart = now - (windowInSeconds * 1000);
  const keyForUser = `requests:${key}`;

  // Fetch elements within the window
  const elements = await client.v4.zRange(keyForUser, 0, -1);
  
  // If no elements exist, initialize the user with the current timestamp
  if (elements.length === 0) {
    console.log('New user detected, initializing the sliding window.');
    await client.v4.zAdd(keyForUser, [{ score: now, value: now.toString() }]);
  }

  // Remove old requests (those outside the window)
  await client.v4.zRemRangeByScore(keyForUser, 0, windowStart);

  // Get the current count of requests within the window
  const requestCount = await client.v4.zCard(keyForUser);
  console.log('Current request count:', requestCount);

  if (requestCount < limit) {
    // Add the new request with the current timestamp
    await client.v4.zAdd(keyForUser, [{ score: now, value: now.toString() }])
        .then(async ()=>{
            // Set the expiration for cleanup
            await client.v4.expire(keyForUser, windowInSeconds);
        })
    return true; // Request allowed
  } else {
    console.log(`Rate limit exceeded for user ${key}`);
    return false; // Rate limit exceeded
  }
};

module.exports = slidingWindow;
