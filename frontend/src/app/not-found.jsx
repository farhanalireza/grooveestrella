// src/app/not-found.jsx
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)] flex flex-col justify-center items-center p-6'>
      <div className='text-center flex flex-col justify-center items-center bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-3xl p-10 max-w-md shadow-2xl'>
        <AlertTriangle size={72} className="text-red-500 mb-6" />
        <h1 className='text-3xl font-extrabold mb-3'>404 - Page Not Found</h1>
        <p className='text-[var(--theme-muted)] mb-8'>Oops! The page you are looking for doesn't exist or has been moved.</p>
        <Link href="/" className='bg-[var(--theme-accent-bg)] hover:opacity-90 text-[var(--theme-accent-fg)] font-bold rounded-full px-8 py-3 transition duration-300 shadow-md'>
          Go To HomePage
        </Link>
      </div>
    </div>
  );
}
