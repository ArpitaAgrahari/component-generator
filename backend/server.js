// backend/server.js (main application entry file)

// Load environment variables from .env file FIRST
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose'); // Import Mongoose
const cors = require('cors');

// Import your connection utilities and Redis client
const connectDB = require('./config/db'); // Your MongoDB connection function
const { connectRedis } = require('./config/redis'); // Your Redis connection function

// Import your API route modules
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const aiRoutes = require('./routes/aiRoutes'); // Assuming you have an aiRoutes module

const app = express();
const PORT = process.env.PORT || 5000; // Use environment variable for port, default to 5000

// --- Middleware ---
// Enable CORS for all origins during development.
// In production, configure this to allow specific origins for security.
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

// --- API Routes ---
// Mount your route modules under specific API paths
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes); // Mount AI routes

// --- Basic Route for Server Health Check ---
app.get('/', (req, res) => {
    res.send('Component Generator Backend API is running!');
});

// --- Server Startup Logic ---
// This asynchronous function ensures that all critical services (DB, Redis)
// are connected before the Express server starts listening.
async function startApplication() {
    try {
        // 1. Connect to MongoDB
        // The mongoose.connect() method no longer requires useNewUrlParser and useUnifiedTopology options in recent versions.
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');

        // 2. Connect to Redis
        // This will call redisClient.connect() internally if not already connected.
        // IMPORTANT: Ensure 'connectRedis()' is NOT called directly in other files (e.g., projectController.js)
        // to avoid multiple connection attempts. It should only be called once here.
        await connectRedis();

        // 3. Start the Express server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        // Log any errors that occur during startup (DB, Redis, or server listen)
        console.error('Application failed to start:', error);
        // It's crucial to exit the process if core services like DB/Redis can't connect,
        // as the application won't function correctly without them.
        process.exit(1);
    }
}

// Call the function to start the entire application
startApplication();
