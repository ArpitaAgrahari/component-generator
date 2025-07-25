const Project = require('../models/Project');

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
    try {
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
        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        console.error('Get project by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
    const { name, chatHistory, generatedCode, uiEditorState } = req.body;

    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        project.name = name ?? project.name;
        project.chatHistory = chatHistory ?? project.chatHistory;
        project.generatedCode = generatedCode ?? project.generatedCode;
        project.uiEditorState = uiEditorState ?? project.uiEditorState;

        const updatedProject = await project.save();
        res.json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};