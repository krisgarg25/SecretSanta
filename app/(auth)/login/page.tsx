"use client";
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SpotlightCard from '@/components/SpotlightCard';
import Ballpit from '@/components/Ballpit';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError("Invalid email or password.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-700 to-red-500 p-4 relative overflow-hidden">
            {/* Christmas Ballpit Background */}
            <div className="absolute inset-0 w-full h-full opacity-80">
                <Ballpit
                    count={120}
                    gravity={0.2}
                    friction={0.99}
                    wallBounce={0.9}
                    followCursor={false}
                    colors={['#ef4444', '#22c55e', '#ffffff', '#fbbf24', '#dc2626', '#16a34a']}
                />
            </div>

            {/* Login Form (on top) */}
            <div className="relative z-10 max-w-md w-full">
                <SpotlightCard spotlightColor="rgba(220, 38, 38, 0.3)">
                    <form onSubmit={handleLogin} className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md p-8 rounded-3xl space-y-4 shadow-2xl">
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold text-white mb-2">🎅 Secret Santa</h1>
                            <p className="text-gray-400 text-sm">Welcome back! Please login</p>
                        </div>

                        {error && <p className="text-red-400 text-center text-sm bg-red-900/30 p-2 rounded">{error}</p>}

                        <input
                            type="email"
                            placeholder="Email"
                            required
                            className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white p-3 rounded-lg font-bold hover:from-red-700 hover:to-red-600 transform transition hover:scale-[1.02] shadow-lg"
                        >
                            Login
                        </button>

                        <p className="text-center text-sm text-gray-400">
                            New here? <Link href="/signup" className="text-red-400 hover:text-red-300 underline font-semibold">Create an Account</Link>
                        </p>
                    </form>
                </SpotlightCard>
            </div>
        </div>
    );
}
