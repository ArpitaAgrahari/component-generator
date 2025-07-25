import './globals.css'; // Import your global CSS here
import { Inter } from 'next/font/google'; // Example font import, keep if you have it

import Providers from './Providers'; // Import your new Providers component

const inter = Inter({ subsets: ['latin'] }); // Example font configuration

export const metadata = {
  title: 'Component Generator', // Your application's main title
  description: 'Generate React components with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap your entire application with the Providers */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
