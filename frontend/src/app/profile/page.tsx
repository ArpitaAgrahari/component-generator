import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const ProfilePage: React.FC = () => {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    // Example: You could add a form here to change password, etc.
    // For this basic example, we just display user info.

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-xl text-gray-600">
                Loading profile...
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Head>
                <title>User Profile - Component Generator</title>
            </Head>
            <header className="flex justify-between items-center p-6 bg-white shadow-sm border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-800">User Profile</h1>
                <div className="flex space-x-4">
                    <Link href="/dashboard" className="py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150">
                        Back to Dashboard
                    </Link>
                    <button
                        onClick={logout}
                        className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="flex-grow p-8 max-w-xl mx-auto w-full">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-600 pb-2">Your Information</h2>
                    <div className="mb-4">
                        <p className="text-gray-600 text-lg"><strong>Email:</strong> {user.email}</p>
                    </div>
                    {/* Add more profile details or forms here, e.g., change password */}
                    {/*
                    <form className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Change Password</h3>
                        <div className="mb-4">
                            <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">Current Password</label>
                            <input type="password" id="current-password" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
                            <input type="password" id="new-password" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                            <input type="password" id="confirm-new-password" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Update Password
                        </button>
                    </form>
                    */}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;