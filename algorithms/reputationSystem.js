const redis = require('redis');
const client = redis.createClient();

/**
 * Get the current reputation score of the user/IP
 * @param {string} key - Unique key for the user/IP (e.g., user ID or IP address)
 * @param {number} defaultScore - The default reputation score for a new user/IP
 * @returns {number} - The current reputation score of the user/IP
 */
const getReputation = async (key, defaultScore = 100) => {
  let score = await client.getAsync(`reputation:${key}`);
  if (!score) {
    score = defaultScore; // Default score if user/IP is new
  }
  return parseInt(score);
};

/**
 * Update the reputation score based on user behavior
 * @param {string} key - Unique key for the user/IP (e.g., user ID or IP address)
 * @param {number} delta - The increment or decrement to adjust the reputation score
 * @returns {void}
 */
const updateReputation = async (key, delta) => {
  await client.incrby(`reputation:${key}`, delta); // Adjust reputation by delta value
};

/**
 * Adjust rate limits dynamically based on the current reputation score
 * @param {string} key - Unique key for the user/IP (e.g., user ID or IP address)
 * @param {number} excessCount - Number of times the user exceeded the limit
 * @returns {object} - The adjusted rate limit configuration for the user/IP
 */
const adjustRateLimits = async (key, excessCount) => {
  const reputationScore = await getReputation(key);

  // Adjust rate limits based on reputation score and excess request count
  if (excessCount < 3) {
    // Provide grace periods for light penalties for the first few breaches
    return { limit: 1000, windowInSeconds: 60 }; // Looser limits
  } else if (reputationScore >= 90) {
    return { limit: 800, windowInSeconds: 60 }; // High reputation - more chances
  } else if (reputationScore >= 50) {
    return { limit: 500, windowInSeconds: 60 };  // Moderate reputation - medium limits
  } else {
    return { limit: 200, windowInSeconds: 60 };  // Low reputation - stricter limits
  }
};

/**
 * Track excess request counts for potential penalties
 * @param {string} key - Unique key for the user/IP (e.g., user ID or IP address)
 * @returns {void}
 */
const trackExcessRequests = async (key) => {
  await client.incr(`excessRequests:${key}`);
  await client.expire(`excessRequests:${key}`, 600); // Reset count after 10 minutes (600 seconds)
};

/**
 * Apply warnings for users who exceed rate limits
 * @param {string} key - Unique key for the user/IP (e.g., user ID or IP address)
 * @returns {void}
 */
const warnUser = async (key) => {
  // Logic to send warning message to the user
  console.log(`Warning: User ${key} has exceeded their rate limit. Please be mindful of your usage.`);
};

module.exports = {
  getReputation,
  updateReputation,
  adjustRateLimits,
  trackExcessRequests,
  warnUser
};
