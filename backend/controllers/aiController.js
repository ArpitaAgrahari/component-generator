const OpenAI = require('openai'); // OpenRouter uses the OpenAI SDK
const Project = require('../models/Project'); // To update the project with new code and chat history
const { client: redisClient, connectRedis } = require('../config/redis'); 

connectRedis();

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1", // OpenRouter API base URL
    apiKey: process.env.OPENROUTER_API_KEY,
});

// Helper function to extract code blocks from AI response
const extractCodeBlocks = (text) => {
    const jsxMatch = text.match(/```jsx\n([\s\S]*?)\n```/);
    const cssMatch = text.match(/```css\n([\s\S]*?)\n```/);

    return {
        jsx: jsxMatch ? jsxMatch[1].trim() : '',
        css: cssMatch ? cssMatch[1].trim() : ''
    };
};

// @desc    Generate a React component using AI and save to project
// @route   POST /api/ai/generate
// @access  Private
exports.generateComponent = async (req, res) => {
    const { projectId, prompt } = req.body;
    const userId = req.user._id;

    if (!projectId || !prompt) {
        return res.status(400).json({ message: 'Project ID and prompt are required.' });
    }

    try {
        const project = await Project.findOne({ _id: projectId, userId });

        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Prepare messages for the AI model
        // Include system message to guide the AI
        // Include previous chat history for context (important for iterative refinement)
        const messages = [
            {
                role: "system",
                content: `You are an AI assistant that generates and modifies React components (JSX/TSX and CSS) based on user prompts.
                Always return the complete JSX/TSX code in a 'jsx' markdown block and the complete CSS code in a 'css' markdown block.
                If the user asks for a modification, apply the changes to the CURRENT component and return the FULL, updated code.
                
                Current JSX/TSX:
                \`\`\`jsx
                ${project.generatedCode.jsx || '/* No JSX yet */'}
                \`\`\`

                Current CSS:
                \`\`\`css
                ${project.generatedCode.css || '/* No CSS yet */'}
                \`\`\`

                Example format:
                \`\`\`jsx
                // Your React JSX/TSX code here
                \`\`\`

                \`\`\`css
                /* Your CSS code here */
                \`\`\`
                `
            },
            ...project.chatHistory.map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : 'user', // Map our roles to OpenAI roles
                content: msg.content
            })),
            {
                role: "user",
                content: prompt
            }
        ];

        // Call the AI model
        const completion = await openai.chat.completions.create({
            model: "google/gemma-2-9b-it", // Or "openai/gpt-4o-mini", "meta-llama/llama-3-8b-instruct"
            messages: messages,
            temperature: 0.7, // Adjust for creativity vs. consistency
            max_tokens: 2000, // Max tokens in AI's response
        });

        const aiResponseContent = completion.choices[0].message.content;
        const { jsx, css } = extractCodeBlocks(aiResponseContent);

        // Update project with new chat history and generated code
        project.chatHistory.push({ role: 'user', content: prompt });
        project.chatHistory.push({ role: 'ai', content: aiResponseContent });
        project.generatedCode.jsx = jsx;
        project.generatedCode.css = css;

        await project.save();

        res.json({
            chatHistory: project.chatHistory,
            generatedCode: project.generatedCode,
            aiResponse: aiResponseContent // Send full response for debugging/display
        });

    } catch (error) {
        console.error('AI generation error:', error);
        if (error.response) { // Axios error for HTTP requests (like OpenRouter API calls)
            console.error('AI API Response Data:', error.response.data);
            console.error('AI API Response Status:', error.response.status);
            return res.status(error.response.status).json({ message: error.response.data.message || 'Error communicating with AI model.' });
        }
        res.status(500).json({ message: 'Server error during AI generation.' });
    }
};