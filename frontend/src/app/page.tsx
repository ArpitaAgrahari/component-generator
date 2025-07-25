'use client'; // This directive is crucial for using client-side hooks like useRouter and useEffect

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter from next/navigation for App Router
import { useAuth } from '../context/AuthContext'; // Adjust path if your context is elsewhere

const HomePage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth(); // Access user and loading state from your AuthContext

  useEffect(() => {
    // Only redirect once authentication loading is complete
    if (!loading) {
      if (user) {
        // If user is authenticated, redirect to the dashboard
        router.push('/dashboard');
      } else {
        // If user is not authenticated, redirect to the login page
        router.push('/login');
      }
    }
  }, [user, loading, router]); // Depend on user, loading, and router to re-run effect when they change

  // While loading or redirecting, you can show a simple loading indicator
  return (
    <div className="min-h-screen flex items-center justify-center text-2xl text-gray-600 bg-gray-50">
      Loading application...
    </div>
  );
};

export default HomePage;