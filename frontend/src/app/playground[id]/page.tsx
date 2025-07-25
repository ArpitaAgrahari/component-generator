'use client'; // This directive is crucial for using client-side hooks in App Router

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import Head from 'next/head'; // Correct import for Head component
import { useAuth } from '../../context/AuthContext'; // Adjust path based on your project structure
import axios from '../../config/axios'; // Adjust path based on your project structure

// Corrected import for SyntaxHighlighter styles
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Using 'prism' theme as it's generally more robust with 'Prism' component,
// but you can switch back to 'hljs' themes if you prefer after fixing this.
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Changed 'cjs' to 'esm' and 'hljs' to 'prism'

// If the above still fails, try this alternative for the style:
// import { atomOneDark } from 'react-syntax-highlighter/styles/hljs'; // Older, but sometimes works if esm/cjs is problematic


// --- Interfaces for Data Structures ---
interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: string; // ISO string
}

interface GeneratedCode {
    jsx: string;
    css: string;
}

// Interface for UI Editor State (for interactive property editing)
interface UiEditorState {
    componentName?: string; // Optional: Name of the root component
    props?: Record<string, any>; // Dynamic object for component props (e.g., { text: "Hello", color: "blue" })
    // You could add styles directly here if you want to manage inline styles,
    // but it's generally better to modify the CSS string directly or use Tailwind classes.
    // styles?: Record<string, string>;
}

// Main Project Interface, combining all data
interface Project {
    _id: string;
    name: string;
    chatHistory: ChatMessage[];
    generatedCode: GeneratedCode;
    uiEditorState: UiEditorState; // Now typed for property editing
    createdAt: string;
    updatedAt: string;
}

interface PlaygroundPageProps {
    params: { id: string };
}

const PlaygroundPage: React.FC<PlaygroundPageProps> = ({ params }) => {
    const router = useRouter();
    // In App Router, dynamic route params are accessed via props.params in server components or client components.
    const projectId = params.id;

    const { user, loading: authLoading, logout } = useAuth();

    // --- State Management ---
    const [project, setProject] = useState<Project | null>(null);
    const [pageLoading, setPageLoading] = useState<boolean>(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [chatInput, setChatInput] = useState<string>('');
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    // Combined tabs for left and right panels
    const [activeTab, setActiveTab] = useState<'chat' | 'properties' | 'preview' | 'jsx' | 'css'>('chat');
    const [isSaving, setIsSaving] = useState<boolean>(false); // For auto-save indicator
    const [localProjectName, setLocalProjectName] = useState<string>(''); // For editable project name

    // --- Refs for DOM elements and timeouts ---
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For debouncing auto-save

    // --- Effect: Project Loading & Authentication Redirection ---
    useEffect(() => {
        // Redirect unauthenticated users
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const fetchProject = async () => {
            if (!projectId) return; // Ensure projectId is available from router.query

            try {
                setPageLoading(true);
                const { data } = await axios.get<Project>(`/projects/${projectId}`);
                setProject(data);
                setLocalProjectName(data.name); // Initialize local name from fetched project
            } catch (err: any) {
                console.error('Failed to fetch project:', err);
                setPageError(err.response?.data?.message || 'Failed to load project.');
            } finally {
                setPageLoading(false);
            }
        };

        // Fetch project only if user is authenticated and projectId is available
        if (user && projectId) {
            fetchProject();
        }
    }, [user, authLoading, projectId, router]); // Dependencies for this effect

    // --- Effect: Auto-scroll chat to bottom ---
    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [project?.chatHistory]); // Trigger scroll when chat history updates

    // --- Function: Send code and UI state to Iframe for rendering ---
    const renderInIframe = useCallback(() => {
        if (iframeRef.current && project?.generatedCode) {
            const iframeWindow = iframeRef.current.contentWindow;
            if (iframeWindow) {
                // Send JSX, CSS, and UI editor state to the iframe
                iframeWindow.postMessage({
                    type: 'renderCode',
                    jsx: project.generatedCode.jsx,
                    css: project.generatedCode.css,
                    uiEditorState: project.uiEditorState || {} // Ensure uiEditorState is always sent
                }, '*'); // WARNING: Use '*' for development. In production, specify your frontend domain for security.
            }
        }
    }, [project?.generatedCode, project?.uiEditorState]); // Re-render if code or UI state changes

    // --- Effect: Trigger iframe re-render when code or UI state changes ---
    useEffect(() => {
        renderInIframe();
    }, [project?.generatedCode, project?.uiEditorState, renderInIframe]);

    // --- Function: Debounced Auto-Save ---
    const autoSaveProject = useCallback(async (currentProject: Project) => {
        if (!currentProject || !currentProject._id) return;

        // Clear any existing timeout to ensure only the latest change triggers a save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        setIsSaving(true); // Indicate saving is in progress
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                // Payload includes all relevant project data to be saved
                const payload = {
                    name: currentProject.name,
                    chatHistory: currentProject.chatHistory,
                    generatedCode: currentProject.generatedCode,
                    uiEditorState: currentProject.uiEditorState,
                };
                await axios.put(`/projects/${currentProject._id}`, payload);
                console.log('Project auto-saved!');
                // Update local project state with the new 'updatedAt' timestamp from backend
                setProject(prev => prev ? { ...prev, updatedAt: new Date().toISOString() } : null);
            } catch (err) {
                console.error('Auto-save failed:', err);
                // Optionally, display a temporary error message to the user
            } finally {
                setIsSaving(false); // End saving indication
            }
        }, 2000); // 2-second debounce delay
    }, []);

    // --- Effect: Trigger auto-save when project data changes ---
    useEffect(() => {
        // Only auto-save if project is loaded, AI is not actively generating, and not during initial page load
        if (project && !aiLoading && !pageLoading) {
            autoSaveProject(project);
        }
    }, [project, aiLoading, pageLoading, autoSaveProject]); // Dependencies for this effect

    // --- Function: Handle Project Name Change (triggers auto-save) ---
    const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setLocalProjectName(newName); // Update local input state
        // Update project state, which in turn triggers the auto-save effect
        setProject(prev => prev ? { ...prev, name: newName } : null);
    };

    // --- Function: Handle Sending Chat Prompt to AI ---
    const handleSendPrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        // Prevent sending if input is empty, AI is busy, or project not loaded
        if (!chatInput.trim() || aiLoading || !project) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: chatInput,
            timestamp: new Date().toISOString()
        };

        // Optimistically update chat history for immediate feedback
        const updatedChatHistory = [...(project.chatHistory || []), userMessage];
        setProject(prev => prev ? {
            ...prev,
            chatHistory: updatedChatHistory,
        } : null);
        setChatInput(''); // Clear input field
        setAiLoading(true); // Show AI loading indicator
        setPageError(null); // Clear any previous page-level errors

        try {
            // Send prompt to backend AI endpoint
            const { data } = await axios.post('/ai/generate', {
                projectId: project._id,
                prompt: chatInput,
            });

            // Update project state with the latest data from the backend (includes AI response,
            // generated code, and potentially updated uiEditorState from AI)
            setProject(prev => prev ? {
                ...prev,
                chatHistory: data.chatHistory,
                generatedCode: data.generatedCode,
                uiEditorState: data.uiEditorState, // Update UI editor state from AI response
                updatedAt: new Date().toISOString() // Backend updated this, confirm here
            } : null);

        } catch (err: any) {
            console.error('AI generation failed:', err);
            setPageError(err.response?.data?.message || 'Failed to generate component.');
            // If AI fails, add an error message to chat history
            setProject(prev => prev ? {
             ...prev,
             chatHistory: [...(prev.chatHistory || []),
               { role: 'ai', content: `Error: ${err.response?.data?.message || 'Failed to generate component.'}`, timestamp: new Date().toISOString() }]
           } : null);
        } finally {
            setAiLoading(false); // Hide AI loading indicator
        }
    };

    // --- Function: Copy Code to Clipboard ---
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // Using a simple alert for now, consider a more subtle toast notification
            alert('Code copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy code.');
        }
    };

    // --- Function: Download Component as ZIP ---
    const handleDownloadCode = async () => {
        if (!project || (!project.generatedCode.jsx && !project.generatedCode.css)) {
            alert('No code to download!');
            return;
        }

        try {
            // Request ZIP file from backend
            const response = await axios.post('/projects/download', {
                projectId: project._id,
                jsx: project.generatedCode.jsx,
                css: project.generatedCode.css,
                projectName: project.name || 'component' // Use project name for zip filename
            }, {
                responseType: 'blob' // Important: tell axios to expect a binary blob
            });

            // Create a URL for the blob and trigger a download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            // Sanitize project name for filename
            link.setAttribute('download', `${(project.name || 'component').replace(/[^a-zA-Z0-9]/g, '_')}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove(); // Clean up the temporary link
            window.URL.revokeObjectURL(url); // Clean up the blob URL
            alert('Component downloaded successfully!');
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download component. Please try again.');
        }
    };

    // --- Function: Handle UI Editor State Changes (for interactive properties) ---
    const handleUiEditorStateChange = useCallback((key: string, value: any) => {
        setProject(prev => {
            if (!prev) return null;
            const updatedUiEditorState = {
                ...prev.uiEditorState,
                props: {
                    ...(prev.uiEditorState.props || {}), // Preserve existing props
                    [key]: value // Update or add the specific prop
                }
            };
            return {
                ...prev,
                uiEditorState: updatedUiEditorState // Update project state, triggers auto-save and iframe re-render
            };
        });
    }, []);

    // Determine props to display in the editor
    const currentProps = project?.uiEditorState?.props || {};
    // Fallback/example props if AI hasn't generated any yet
    const availableProps = Object.keys(currentProps).length > 0
        ? Object.keys(currentProps)
        : ['text', 'color', 'size', 'isDisabled']; // Example common props

    // --- Loading States and Error Handling UI ---
    if (authLoading || pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-2xl text-gray-600 bg-gray-50">
                Loading playground...
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 text-red-800 p-8 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold mb-4">Error</h1>
                <p className="text-xl mb-6">{pageError}</p>
                <button onClick={() => router.push('/dashboard')} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Go to Dashboard
                </button>
            </div>
        );
    }

    // Fallback if project or user somehow become null (should be caught by redirects/loading states)
    if (!user || !project) {
        return null;
    }

    // --- Main Component JSX ---
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Head>
                <title>{localProjectName || 'Untitled'} - Component Playground</title>
            </Head>

            {/* Header */}
            <header className="flex justify-between items-center p-4 bg-white shadow-sm border-b border-gray-200">
                {/* Editable Project Name */}
                <input
                    type="text"
                    value={localProjectName}
                    onChange={handleProjectNameChange}
                    placeholder="Enter project name"
                    className="text-xl font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 focus:border-b focus:border-blue-500 max-w-xs"
                />
                <div className="flex items-center space-x-4">
                    {isSaving && <span className="text-sm text-gray-500">Saving...</span>}
                    {!isSaving && project.updatedAt && (
                        <span className="text-gray-600 text-sm">Last saved: {new Date(project.updatedAt).toLocaleTimeString()}</span>
                    )}
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={logout}
                        className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Layout: Left Panel (Chat/Properties) and Right Panel (Preview/Code) */}
            <div className="flex flex-grow overflow-hidden">
                {/* Left Panel: Chat & Properties */}
                <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col p-4 shadow-md overflow-hidden">
                    {/* Tab Navigation for Left Panel */}
                    <div className="flex mb-4 border-b border-gray-300">
                        <button
                            className={`flex-1 px-2 py-2 text-md font-medium ${activeTab === 'chat' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            Chat
                        </button>
                        <button
                            className={`flex-1 px-2 py-2 text-md font-medium ${activeTab === 'properties' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                            onClick={() => setActiveTab('properties')}
                        >
                            Properties
                        </button>
                    </div>

                    {/* Content based on Left Panel Active Tab */}
                    {activeTab === 'chat' && (
                        <div className="flex flex-col flex-grow overflow-hidden">
                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                {project.chatHistory.length === 0 ? (
                                    <p className="text-gray-500 text-center mt-8">Start by describing the component you want to build!</p>
                                ) : (
                                    project.chatHistory.map((msg, index) => (
                                        <div key={index} className={`mb-3 p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-900 self-end ml-auto max-w-[80%]' : 'bg-gray-100 text-gray-800 self-start mr-auto max-w-[80%]'}`}>
                                            <p className="text-sm font-semibold mb-1 capitalize">{msg.role}:</p>
                                            <p className="text-base whitespace-pre-wrap">{msg.content}</p>
                                            <span className="text-xs text-gray-500 mt-1 block">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    ))
                                )}
                                {aiLoading && (
                                    <div className="mb-3 p-3 rounded-lg bg-gray-100 text-gray-800 self-start mr-auto max-w-[80%]">
                                        <p className="text-sm font-semibold mb-1">AI:</p>
                                        <p className="text-base">Generating component... <span className="text-gray-500">(This may take a moment)</span></p>
                                    </div>
                                )}
                                <div ref={chatMessagesEndRef} />
                            </div>
                            <form onSubmit={handleSendPrompt} className="mt-4 flex">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Describe your component..."
                                    className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={aiLoading}
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition duration-150 disabled:bg-blue-400"
                                    disabled={aiLoading}
                                >
                                    Send
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'properties' && (
                        <div className="flex flex-col flex-grow overflow-y-auto pr-2 custom-scrollbar">
                            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Component Properties</h2>
                            {Object.keys(currentProps).length === 0 && (
                                <p className="text-gray-500">No editable properties detected yet. Try generating a component with explicit props like "a button with text 'Click Me'".</p>
                            )}
                            {availableProps.map(propName => (
                                <div key={propName} className="mb-4">
                                    <label htmlFor={`prop-${propName}`} className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                        {propName}:
                                    </label>
                                    {/* Simple input type detection, expand as needed for color pickers, sliders etc. */}
                                    {typeof currentProps[propName] === 'boolean' ? (
                                        <input
                                            type="checkbox"
                                            id={`prop-${propName}`}
                                            checked={currentProps[propName] || false}
                                            onChange={(e) => handleUiEditorStateChange(propName, e.target.checked)}
                                            className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                        />
                                    ) : (
                                        <input
                                            type="text" // Default to text, can be expanded to 'color', 'number'
                                            id={`prop-${propName}`}
                                            value={currentProps[propName] || ''}
                                            onChange={(e) => handleUiEditorStateChange(propName, e.target.value)}
                                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Panel: Preview & Code */}
                <div className="flex-grow flex flex-col bg-gray-100 p-4 overflow-hidden">
                    {/* Tab Navigation for Right Panel */}
                    <div className="flex mb-4 border-b border-gray-300">
                        <button
                            className={`px-4 py-2 text-lg font-medium ${activeTab === 'preview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                            onClick={() => setActiveTab('preview')}
                        >
                            Preview
                        </button>
                        <button
                            className={`px-4 py-2 text-lg font-medium ${activeTab === 'jsx' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                            onClick={() => setActiveTab('jsx')}
                        >
                            JSX/TSX
                        </button>
                        <button
                            className={`px-4 py-2 text-lg font-medium ${activeTab === 'css' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                            onClick={() => setActiveTab('css')}
                        >
                            CSS
                        </button>
                        {/* Download Button */}
                        <button
                            onClick={handleDownloadCode}
                            className="ml-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-150 flex items-center"
                            title="Download as .zip"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download
                        </button>
                    </div>

                    {/* Content based on Right Panel Active Tab */}
                    <div className="flex-grow bg-white border border-gray-200 rounded-md shadow-inner overflow-hidden relative">
                        {activeTab === 'preview' && (
                            <div className="h-full w-full flex items-center justify-center p-4">
                                {project.generatedCode.jsx || project.generatedCode.css ? (
                                    <iframe
                                        ref={iframeRef}
                                        src="/sandbox.html" // Path to your static sandbox HTML file
                                        title="Component Preview"
                                        className="w-full h-full border-none rounded-md"
                                        sandbox="allow-scripts allow-same-origin allow-popups" // Essential for security
                                    ></iframe>
                                ) : (
                                    <p className="text-gray-500 text-center">AI generated component will appear here.</p>
                                )}
                            </div>
                        )}

                        {(activeTab === 'jsx' || activeTab === 'css') && (
                            <div className="h-full w-full relative">
                                <SyntaxHighlighter
                                    language={activeTab === 'jsx' ? 'jsx' : 'css'}
                                    style={atomDark}
                                    customStyle={{
                                        height: '100%',
                                        margin: 0,
                                        padding: '1rem',
                                        borderRadius: '0.375rem',
                                        overflow: 'auto'
                                    }}
                                >
                                    {activeTab === 'jsx' ? (project.generatedCode.jsx || '// No JSX/TSX code generated yet.') : (project.generatedCode.css || '/* No CSS code generated yet. */')}
                                </SyntaxHighlighter>
                                <button
                                    onClick={() => copyToClipboard(activeTab === 'jsx' ? project.generatedCode.jsx : project.generatedCode.css)}
                                    className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600 transition duration-150"
                                >
                                    Copy {activeTab === 'jsx' ? 'JSX' : 'CSS'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaygroundPage;