# Rate Limiting Middleware

This rate-limiting middleware enables you to apply different rate-limiting algorithms (Token Bucket, Sliding Window, Leaky Bucket) in an Express.js application. This setup also integrates Redis to manage the state of requests efficiently across distributed systems.

## Setup

Before you can use the rate-limiting middleware, ensure you have Redis installed and running on your local machine or accessible remotely.

### Redis Setup

To install Redis, follow the instructions for your operating system from the official Redis website:

- [Redis Installation Guide](https://redis.io/download)

Once Redis is installed and running, you can set up your Express.js application with this rate-limiter.

### Installation

1. Clone this repository or include the rate-limiter files in your project.
2. Install necessary dependencies by running:

```bash
npm install express redis
```

3. Initialize Redis and configure the Redis connection in your application:

```javascript
const express = require('express');
const { redisConfig } = require('./redisClient');
const rateLimiter = require('./rate-limiter');
```

## Usage

### Rate Limiting Middleware

To apply rate-limiting to any route in your application, you need to call the `rateLimiter` function and pass the desired algorithm and its corresponding configuration.

```javascript
app.get('/api/resource', rateLimiter('tokenBucket', { limit: 10, refillRate: 1, windowInSeconds: 60, client }), (req, res) => {
    res.send('This is a rate-limited resource!');
});
```

### Configuring Redis Connection

The Redis client needs to be properly initialized before it is passed to the rate-limiter middleware. The Redis setup in `redisConfig` should be done before any routes are defined to ensure smooth operation.

Example:

```javascript
const redisSetUp = { host: 'localhost', port: 6379 };

redisConfig(redisSetUp).then((client) => {
    // Pass the `client` to the rate limiter
});
```

## Available Algorithms

This package supports three different rate-limiting algorithms:

1. **Token Bucket**
2. **Sliding Window**
3. **Leaky Bucket**

Each algorithm is designed for different use cases, and you should choose the one that best suits your needs.

### 1. Token Bucket Algorithm

**Description**: The Token Bucket algorithm allows a burst of requests followed by a regulated refill of tokens at a constant rate. Requests are only processed if there are available tokens.

**Best Use Case**: When you want to allow occasional bursts of traffic but control the overall request rate in the long term. Useful for APIs that can tolerate temporary spikes in traffic.

#### Parameters:
- **limit**: The maximum number of tokens (requests) that can be handled in one burst.
- **refillRate**: The number of tokens refilled in the bucket per time unit.
- **windowInSeconds**: The time window (in seconds) within which tokens are refilled.
- **client**: Redis client instance for managing the rate-limiting state.

#### Example:
```javascript
app.get('/api/resource', rateLimiter('tokenBucket', { limit: 10, refillRate: 1, windowInSeconds: 60, client }), (req, res) => {
    res.send('Rate-limited with Token Bucket');
});
```

### 2. Sliding Window Algorithm

**Description**: The Sliding Window algorithm smooths out request patterns by dividing the time window into smaller intervals. Requests are counted within the current and previous intervals, providing a more accurate measurement of request rates.

**Best Use Case**: When you want more even distribution of requests and avoid bursty traffic patterns. This algorithm is ideal when strict control over request rates is required, ensuring that requests are handled consistently.

#### Parameters:
- **limit**: The maximum number of requests allowed within the window.
- **windowInSeconds**: The length of the time window (in seconds) over which requests are tracked.
- **client**: Redis client instance for managing the rate-limiting state.

#### Example:
```javascript
app.get('/api/data', rateLimiter('slidingWindow', { limit: 5, windowInSeconds: 60, client }), (req, res) => {
    res.send('Rate-limited with Sliding Window');
});
```

### 3. Leaky Bucket Algorithm

**Description**: The Leaky Bucket algorithm regulates the rate at which requests are processed, ensuring a steady flow. It queues excess requests and "leaks" them at a constant rate.

**Best Use Case**: When you want to process requests at a steady rate regardless of traffic spikes. It’s useful for systems where a consistent request processing rate is more important than immediate response.

#### Parameters:
- **capacity**: The maximum number of requests that can be stored in the bucket.
- **period**: The time interval (in milliseconds) at which the bucket is checked.
- **leaksPerPeriod**: The number of requests that "leak" (are processed) from the bucket per period.
- **requestExpiryInSeconds**: The time after which requests in the bucket are discarded.
- **client**: Redis client instance for managing the rate-limiting state.

#### Example:
```javascript
app.post('/api/upload', rateLimiter('leakyBucket', { capacity: 10, period: 50, leaksPerPeriod: 5, requestExpiryInSeconds: 90, client }), (req, res) => {
    res.send('Rate-limited with Leaky Bucket');
});
```

## When to Use Each Algorithm

### Token Bucket:
- **Use When**: You want to allow bursts of traffic followed by a regulated request flow.
- **Example**: An API that can handle occasional traffic surges but needs to maintain an average request rate over time.

### Sliding Window:
- **Use When**: You need even distribution of requests over time, ensuring consistent rate limiting.
- **Example**: Login rate limiter to prevent brute-force attacks without allowing bursts of login attempts.

### Leaky Bucket:
- **Use When**: You want a steady request flow, processing requests at a constant rate.
- **Example**: A system that cannot handle traffic spikes and needs a smooth flow of requests, such as a media server.

## Error Handling

If the Redis client fails to connect or is unavailable, the middleware will respond with a `503 Service Unavailable` error. Ensure your Redis service is running correctly and reachable from your application.

Example error handling:

```javascript
redisConfig(redisSetUp).catch((err) => {
    console.error('Failed to initialize Redis:', err);
    process.exit(1);
});
```

## Conclusion

This rate-limiter is a versatile solution for controlling traffic to your APIs. By leveraging Redis, it can scale across multiple servers, making it ideal for distributed systems. Each algorithm offers a unique approach to managing request flow, so choose the one that best fits your application's needs.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contribution

Contributions are welcome! If you have suggestions for improvements or additional features, feel free to open an issue or submit a pull request.

## Contact

For questions, feature requests, or feedback, please contact the author at [aks7aynair@gmail.com].
