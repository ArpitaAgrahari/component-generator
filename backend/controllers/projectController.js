const Project = require('../models/Project');
const { client: redisClient, connectRedis } = require('../config/redis'); // Import Redis client

// Ensure Redis is connected when the app starts
// This should ideally be called once in your main server.js file
// or where your application initializes. For testing, it's here.
connectRedis();

// Cache duration in seconds (e.g., 1 hour)
const CACHE_EXPIRATION = 3600;

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
    try {
        // For 'getProjects', we typically don't cache the entire list
        // as it's dynamic per user and can change frequently.
        const projects = await Project.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a new empty project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
    try {
        const project = await Project.create({ userId: req.user._id });
        // Cache the newly created project
        // Note: project.userId is an ObjectId, JSON.stringify handles it,
        // but when parsing back, it will be a string. Be mindful if you need ObjectId methods.
        await redisClient.setEx(`project:${project._id}`, CACHE_EXPIRATION, JSON.stringify(project));
        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get a single project by ID (with Redis caching)
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user._id; // This is an ObjectId

        // 1. Try to get from Redis cache
        const cachedProject = await redisClient.get(`project:${projectId}`);
        if (cachedProject) {
            const project = JSON.parse(cachedProject);
            // Ensure the cached project belongs to the current user
            // Convert userId to string for comparison as it might be a string from Redis
            if (project.userId.toString() === userId.toString()) {
                console.log('Project fetched from Redis cache');
                return res.json(project);
            } else {
                // If cached project exists but belongs to a different user,
                // treat it as not found for the current user's request.
                console.log('Cached project found but does not belong to current user, fetching from DB.');
            }
        }

        // 2. If not in cache or not owned by user, fetch from MongoDB
        const project = await Project.findOne({ _id: projectId, userId });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // 3. Cache the project in Redis
        // Ensure the project object is converted to a plain object before stringifying
        // to avoid issues with Mongoose document methods being serialized.
        await redisClient.setEx(`project:${projectId}`, CACHE_EXPIRATION, JSON.stringify(project.toObject()));
        console.log('Project fetched from MongoDB and cached in Redis');
        res.json(project);
    } catch (error) {
        console.error('Get project by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a project (invalidate/update Redis cache)
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
    const { name, chatHistory, generatedCode, uiEditorState } = req.body;
    const projectId = req.params.id;
    const userId = req.user._id;

    try {
        const project = await Project.findOne({ _id: projectId, userId });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Update fields only if they are provided in the request body (nullish coalescing)
        project.name = name ?? project.name;
        project.chatHistory = chatHistory ?? project.chatHistory;
        project.generatedCode = generatedCode ?? project.generatedCode;
        project.uiEditorState = uiEditorState ?? project.uiEditorState;

        const updatedProject = await project.save();

        // Update cache after successful save
        // Use .toObject() to ensure only plain data is cached
        await redisClient.setEx(`project:${projectId}`, CACHE_EXPIRATION, JSON.stringify(updatedProject.toObject()));
        res.json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};