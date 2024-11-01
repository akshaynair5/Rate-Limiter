const slidingWindow = async (key, limit, windowInSeconds, client) => {
  const now = Date.now();
  const windowStart = now - windowInSeconds * 1000;
  const keyForUser = `requests:${key}`;

  // Remove requests that are outside the sliding window
  await client.v4.zRemRangeByScore(keyForUser, 0, windowStart);

  // Get the count of requests within the sliding window
  const requestCount = await client.v4.zCard(keyForUser);

  console.log('Current request count:', requestCount);

  // If the request count is within the limit, allow the request
  if (requestCount < limit) {
    // Add the current request timestamp to the sorted set
    await client.v4.zAdd(keyForUser, [{ score: now, value: now.toString() }]);

    // Set the expiration only if the key is newly created
    const ttl = await client.v4.ttl(keyForUser);
    if (ttl === -1) { // -1 means no expiration is set
      await client.v4.expire(keyForUser, windowInSeconds);
    }

    return true; // Request allowed
  } else {
    console.log(`Rate limit exceeded for user ${key}`);
    return false; // Rate limit exceeded
  }
};

module.exports = slidingWindow;
