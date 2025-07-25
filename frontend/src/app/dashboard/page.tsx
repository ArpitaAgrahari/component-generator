"use client"
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from '../../config/axios';
import Head from 'next/head'; // Import Head for title
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
    _id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    // Add other fields as needed for display
}

const DashboardPage: React.FC = () => {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [projectsLoading, setProjectsLoading] = useState<boolean>(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login'); // Redirect if not authenticated
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setProjectsLoading(true);
                const { data } = await axios.get<Project[]>('/projects');
                setProjects(data);
            } catch (err: any) {
                console.error('Failed to fetch projects:', err);
                setProjectsError(err.response?.data?.message || 'Failed to load projects.');
            } finally {
                setProjectsLoading(false);
            }
        };

        if (user) { // Only fetch if user is authenticated
            fetchProjects();
        }
    }, [user]); // Re-fetch when user changes (e.g., after login)

    const handleCreateNewSession = async () => {
        try {
            const { data } = await axios.post<Project>('/projects');
            // Redirect to a specific page or load this new project directly for editing
            router.push(`/playground/${data._id}`);
        } catch (err: any) {
            console.error('Failed to create new project:', err);
            setProjectsError(err.response?.data?.message || 'Failed to create new session.');
        }
    };

    const handleLoadSession = (projectId: string) => {
        router.push(`/playground/${projectId}`);
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-600">
                Loading authentication...
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Head>
                <title>Dashboard - Component Generator</title>
            </Head>
            <header className="flex justify-between items-center p-6 bg-white shadow-sm border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-800">Welcome, {user.email}!</h1>
                <div className="flex space-x-4">
                    <Link href="/profile" className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                        Profile
                    </Link>
                    <button
                        onClick={logout}
                        className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="flex-grow p-8 max-w-4xl mx-auto w-full">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-600 pb-2">
                        Your Saved Sessions
                    </h2>
                    <button
                        onClick={handleCreateNewSession}
                        className="mb-8 py-3 px-6 bg-green-600 text-white font-semibold rounded-md text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-300"
                    >
                        Create New Session
                    </button>

                    {projectsLoading ? (
                        <p className="text-center text-gray-500">Loading sessions...</p>
                    ) : projectsError ? (
                        <p className="text-red-500 text-center mt-4">{projectsError}</p>
                    ) : projects.length === 0 ? (
                        <p className="text-center text-gray-600">No saved sessions yet. Create a new one!</p>
                    ) : (
                        <ul className="space-y-4">
                            {projects.map((project) => (
                                <li key={project._id} className="flex justify-between items-center p-4 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition duration-150">
                                    <span className="text-lg font-medium text-gray-700">
                                        {project.name} (Last updated:{' '}
                                        {new Date(project.updatedAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })})
                                    </span>
                                    <button
                                        onClick={() => handleLoadSession(project._id)}
                                        className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        Load
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;