// src/app/not-found.jsx
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='min-h-screen bg-[#07090F] text-[#F4F7FF] flex flex-col justify-center items-center p-6'>
      <div className='text-center flex flex-col justify-center items-center bg-[#10141F] border border-[#2563EB]/15 rounded-2xl p-10 max-w-md shadow-2xl shadow-[#2563EB]/5'>
        <AlertTriangle size={72} className="text-red-500 mb-6" />
        <h1 className='text-3xl font-extrabold mb-3'>404 - Page Not Found</h1>
        <p className='text-[#8992A5] mb-8'>Oops! The page you are looking for doesn't exist or has been moved.</p>
        <Link href="/" className='bg-[#2563EB] hover:bg-[#60A5FA] text-[#F4F7FF] font-semibold rounded-full px-8 py-3 transition duration-300'>
          Go To HomePage
        </Link>
      </div>
    </div>
  );
}
