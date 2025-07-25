'use client'; // This directive makes this a Client Component

import React from 'react';
import { AuthProvider } from '../context/AuthContext'; // Adjust path as needed

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

export default Providers;
