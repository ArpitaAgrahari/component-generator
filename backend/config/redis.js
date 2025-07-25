const { createClient } = require('redis');

// This line is crucial. It should ONLY use process.env.REDIS_URL if available.
// The fallback 'redis://localhost:6379' is only for when REDIS_URL is NOT set.
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';

const redisClient = createClient({
    url: REDIS_URI
});

redisClient.on('error', err => {
    console.error('Redis Client Error:', err);
    // You might want to implement more robust error handling here.
});

async function connectRedis() {
    // Log the URL being used for connection for debugging
    console.log(`Attempting to establish new connection to Redis at: ${REDIS_URI}`);

    if (!redisClient.isReady && !redisClient.isOpen) {
        try {
            await redisClient.connect();
            console.log('Redis connected successfully!');
        } catch (err) {
            console.error('Failed to connect to Redis:', err);
        }
    } else {
        console.log('Redis connection already initiated or established.');
    }
}

module.exports = {
    client: redisClient,
    connectRedis
};
