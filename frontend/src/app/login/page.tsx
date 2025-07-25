'use client'; // This directive is crucial for using client-side hooks in App Router

import React, { useState, useEffect } from 'react';
import axios from '../../config/axios'; // Adjust path as per your project structure
import { useAuth } from '../../context/AuthContext'; // Adjust path as per your project structure
import { useRouter } from 'next/navigation'; // Correct import for App Router
import Link from 'next/link';
// Removed: import Head from 'next/head'; // Head is generally not used directly in App Router client components for metadata

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { user, login, loading: authLoading } = useAuth();
    const router = useRouter();

    // Redirect if already authenticated and auth state has loaded
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setLoading(true);

        try {
            // Adjust the API endpoint as per your backend setup
            const { data } = await axios.post('/auth/login', { email, password });
            
            // Assuming your backend returns user info and token on successful login
            login(data.token, { _id: data._id, email: data.email });
            // The login function will handle redirection to /dashboard
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    // Show loading spinner or message while authentication status is being determined
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary-950">
                <p className="text-white text-xl">Loading authentication...</p>
            </div>
        );
    }

    // If user is already logged in, this page won't render due to the useEffect redirect.
    // If authLoading is false and no user, then render the login form.
    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-950 font-sans">
            {/* Removed Head component as it's not typically used in App Router client components for metadata */}
            {/* <Head>
                <title>Login - Component Generator</title>
            </Head> */}
            <div className="bg-primary-900 p-8 rounded-lg shadow-xl w-full max-w-md border border-primary-800">
                <div className="flex justify-center mb-6">
                    {/* Flowbite-like logo */}
                    <span className="text-primary-500 text-4xl font-bold flex items-center">
                        <svg className="w-10 h-10 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                        </svg>
                        Flowbite
                    </span>
                </div>
                <h2 className="text-2xl font-bold text-center text-white mb-6">
                    Sign in to your account
                </h2>
                {error && (
                    <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-md relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-primary-100 mb-1">Your email</label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-3 bg-primary-800 text-white border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-400"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-primary-100 mb-1">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 bg-primary-800 text-white border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-primary-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                className="w-4 h-4 text-primary-600 bg-primary-800 border-primary-700 rounded focus:ring-primary-500"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-primary-300">Remember me</label>
                        </div>
                        <Link href="/forgot-password" className="text-sm text-primary-500 hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg text-base hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-primary-900 disabled:opacity-50 transition duration-200"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign in'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-primary-400">
                    Don't have an account yet?{' '}
                    <Link href="/signup" className="text-primary-500 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
