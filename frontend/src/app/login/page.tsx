'use client'

import React, { useState } from 'react';
import axios from '../../config/axios';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import Head from 'next/head'; // Import Head for title

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.post('/auth/login', { email, password });
            login(data.token, { _id: data._id, email: data.email });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Head>
                <title>Login - Component Generator</title>
            </Head>
            <div className="bg-white p-10 rounded-lg shadow-xl text-center w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Login</h1>
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mb-4 p-3 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mb-6 p-3 border border-gray-300 rounded-md text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-md text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition duration-300"
                    >
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                    {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
                </form>
                <p className="mt-6 text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                        Signup
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;