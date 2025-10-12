// app/register/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/auth?mode=signup');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-400">Redirecting to sign up...</p>
      </div>
    </div>
  );
}
