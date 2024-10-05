```markdown
# Rate Limiting Middleware

A flexible and powerful rate-limiting middleware for Node.js applications that allows developers to control API usage with various algorithms. It supports customizable rate limits, an IP reputation system for dynamic adjustments, and provides a user-friendly experience for both developers and end-users.

## Features

- **Multiple Rate Limiting Algorithms**: Choose from three algorithms:
  - **Token Bucket**: Allows bursts of traffic while maintaining an average rate.
  - **Sliding Window**: Tracks requests over rolling time periods to prevent spikes.
  - **Leaky Bucket**: Processes requests at a fixed rate, smoothing out bursts.

- **IP Reputation System**: Dynamically adjusts rate limits based on user behavior, rewarding good customers and penalizing abusive users.

- **Grace Periods**: Users can exceed rate limits a specified number of times before penalties are applied, improving user experience.

- **Real-Time Logging**: Built-in logging for tracking request counts and rate-limit breaches.

- **User-Friendly Documentation**: Comprehensive documentation to guide developers in integrating and using the middleware effectively.

## Installation

You can install the package via npm. Run the following command in your project directory:

```bash
npm install rate-limiting-middleware
```

## Usage

### Basic Setup

1. **Import the Middleware**:

```javascript
const express = require('express');
const rateLimiter = require('rate-limiting-middleware');

const app = express();
```

2. **Configure and Use the Middleware**:

You can choose the rate-limiting algorithm and set the desired limits. Here's an example:

```javascript
// Token Bucket example
app.use('/api/resource', rateLimiter('tokenBucket', { 
  limit: 1000, 
  refillRate: 10, // 10 tokens added every second 
  windowInSeconds: 60 
}));

// Sliding Window example
app.use('/api/data', rateLimiter('slidingWindow', { 
  limit: 500, 
  windowInSeconds: 60 
}));

// Leaky Bucket example
app.use('/api/upload', rateLimiter('leakyBucket', { 
  limit: 50, 
  ratePerSecond: 1 // 1 request processed per second 
}));

app.get('/api/resource', (req, res) => {
  res.send('This is a rate-limited resource!');
});
```

### Adjusting Rate Limits Based on IP Reputation

You can also integrate the IP reputation system to dynamically adjust rate limits:

```javascript
app.use('/api', async (req, res, next) => {
  const userId = req.user.id || req.ip; // Unique identifier

  const excessCount = await client.getAsync(`excessRequests:${userId}`) || 0;

  const { limit, windowInSeconds } = await adjustRateLimits(userId, excessCount);

  // Pass limit to the rate-limiting function based on reputation
  let allowed = await tokenBucket(userId, limit, 10, windowInSeconds);
  
  if (allowed) {
    await client.del(`excessRequests:${userId}`);
    next(); // Allow the request
  } else {
    await trackExcessRequests(userId);
    await warnUser(userId);
    res.status(429).json({ message: 'Rate limit exceeded, but you have more chances!' });
  }
});
```

## Configuration Options

- **Algorithm**: Specify which rate-limiting algorithm to use (`tokenBucket`, `slidingWindow`, `leakyBucket`).
- **Limit**: The maximum number of requests allowed within the specified time window.
- **Refill Rate** (Token Bucket only): The rate at which tokens are added.
- **Window In Seconds**: The time window for rate limiting in seconds.
- **Rate Per Second** (Leaky Bucket only): The fixed rate at which requests are processed.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contribution

Contributions are welcome! If you have suggestions for improvements or additional features, feel free to open an issue or submit a pull request.

## Contact

For questions, feature requests, or feedback, please contact the author at [aks7aynair@gmail.com].
