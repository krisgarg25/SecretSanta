// app/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function LandingPage() {
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        });
        return () => unsub();
    }, [router]);

    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
}
