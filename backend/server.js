const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Enable CORS for all origins
app.use(express.json()); //parse json request bodies


// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));


// Basic Route
app.get('/', (req, res) => {
    res.send('Component Generator Backend API is running!');
});


const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

