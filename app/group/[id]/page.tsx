"use client";
import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter, useParams } from 'next/navigation';
import Galaxy from '@/components/Galaxy';

interface Member {
    email: string;
    name: string;
}

interface GroupData {
    name: string;
    organizer: string;
    organizerName: string;
    members: Member[];
    assignments: Record<string, string>;
    status: 'open' | 'generated';
}

export default function GroupPage() {
    const params = useParams();
    const groupId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [groupData, setGroupData] = useState<GroupData | null>(null);
    const [myAssignment, setMyAssignment] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) router.push('/login');
            else setUser(currentUser);
        });
        return () => unsub();
    }, [router]);

    useEffect(() => {
        if (!groupId || !user) return;
        const unsub = onSnapshot(doc(db, "groups", groupId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as GroupData;
                setGroupData(data);
                if (data.status === 'generated' && data.assignments && data.assignments[user.email!]) {
                    setMyAssignment(data.assignments[user.email!]);
                }
                setLoading(false);
            } else {
                alert("Group not found!");
                router.push('/dashboard');
            }
        });
        return () => unsub();
    }, [groupId, user, router]);

    const handleGeneratePairs = async () => {
        if (!groupData || !groupId) return;

        setIsGenerating(true);

        // Add a small delay for UX
        await new Promise(resolve => setTimeout(resolve, 1000));

        const members = [...groupData.members];
        for (let i = members.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [members[i], members[j]] = [members[j], members[i]];
        }

        const assignments: Record<string, string> = {};
        for (let i = 0; i < members.length; i++) {
            const giver = members[i];
            const receiver = members[(i + 1) % members.length];
            assignments[giver.email] = receiver.name;
        }

        await updateDoc(doc(db, "groups", groupId), {
            assignments: assignments,
            status: 'generated'
        });

        setIsGenerating(false);
    };

    const copyGroupId = () => {
        if (!groupId) return;
        navigator.clipboard.writeText(groupId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-white">Loading Group...</p>
            </div>
        </div>
    );

    if (!groupData) return null;

    const isOrganizer = user?.email === groupData.organizer;

    return (
        <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
            {/* Galaxy Background */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                <Galaxy
                    mouseRepulsion={true}
                    mouseInteraction={true}
                    density={1.2}
                    glowIntensity={0.6}
                    saturation={0.9}
                    hueShift={340}
                />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <nav className="bg-gray-900/60 backdrop-blur-md border-b border-gray-800/50 px-6 py-4">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition group"
                        >
                            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="font-medium">Back to Dashboard</span>
                        </button>

                        {isOrganizer && (
                            <span className="bg-yellow-900/30 text-yellow-400 border border-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                👑 ORGANIZER
              </span>
                        )}
                    </div>
                </nav>

                {/* Main Content */}
                <main className="max-w-6xl mx-auto px-6 py-12">

                    {/* Group Header */}
                    <div className="text-center mb-12">
                        <div className="inline-block mb-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-5xl shadow-2xl shadow-red-900/50 mx-auto">
                                🎅
                            </div>
                        </div>
                        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-red-400 via-red-500 to-green-400 text-transparent bg-clip-text">
                            {groupData.name}
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Organized by <span className="text-white font-semibold">{groupData.organizerName}</span>
                        </p>
                    </div>

                    {/* Group ID Card */}
                    {groupData.status === 'open' && (
                        <div className="max-w-2xl mx-auto mb-12">
                            <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 text-center">
                                <p className="text-gray-400 text-sm uppercase tracking-wider mb-3">Share This Invite Code</p>
                                <div className="flex items-center justify-center gap-3">
                                    <code className="text-2xl font-mono font-bold text-white bg-black/50 px-6 py-3 rounded-xl border border-gray-700">
                                        {groupId}
                                    </code>
                                    <button
                                        onClick={copyGroupId}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition transform hover:scale-105"
                                    >
                                        {copied ? '✓ Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assignment/Status Section */}
                    <div className="max-w-4xl mx-auto mb-12">
                        {groupData.status === 'generated' ? (
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-green-800 rounded-3xl blur-xl opacity-50"></div>
                                <div className="relative bg-gradient-to-br from-gray-900 via-green-900/20 to-black border border-green-700/50 rounded-3xl p-12 text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-green-900/50 animate-pulse">
                                        🎄
                                    </div>
                                    <h2 className="text-2xl font-bold text-green-400 uppercase tracking-wider mb-4">
                                        Your Secret Mission
                                    </h2>
                                    {myAssignment ? (
                                        <div>
                                            <p className="text-gray-400 mb-3">You are the Secret Santa for:</p>
                                            <p className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                                                {myAssignment}
                                            </p>
                                            <p className="text-gray-500 text-sm">🤫 Keep it secret!</p>
                                        </div>
                                    ) : (
                                        <p className="text-red-400 font-bold">You were not included in this draw</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-30"></div>
                                <div className="relative bg-gradient-to-br from-gray-900 via-blue-900/20 to-black border border-blue-700/50 rounded-3xl p-12 text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-blue-900/50 animate-bounce">
                                        ⏳
                                    </div>
                                    <h2 className="text-2xl font-bold text-blue-400 mb-4">
                                        Waiting for Everyone to Join
                                    </h2>
                                    <p className="text-gray-400 mb-6">
                                        Share the group code above to invite more people
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                    <span className="bg-blue-900/50 text-blue-400 border border-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                      {groupData.members.length} Members
                    </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Generate Button (Organizer Only) */}
                    {isOrganizer && groupData.status === 'open' && (
                        <div className="max-w-2xl mx-auto mb-12">
                            <button
                                onClick={handleGeneratePairs}
                                disabled={isGenerating || groupData.members.length < 2}
                                className={`w-full py-6 rounded-2xl font-bold text-xl transition-all duration-300 ${
                                    isGenerating || groupData.members.length < 2
                                        ? "bg-purple-900/30 cursor-not-allowed text-gray-500"
                                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-purple-900/50 transform hover:scale-[1.02]"
                                }`}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Pairs...
                  </span>
                                ) : (
                                    <span>🎲 Generate Secret Santa Pairs</span>
                                )}
                            </button>
                            {groupData.members.length < 2 && (
                                <p className="text-center text-red-400 text-sm mt-3">
                                    ⚠️ Need at least 2 members to generate pairs
                                </p>
                            )}
                            <p className="text-center text-gray-500 text-sm mt-3">
                                ⚠️ Warning: Once generated, no one else can join this group
                            </p>
                        </div>
                    )}

                    {/* Members List */}
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-8">
                            <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                                <h3 className="text-2xl font-bold text-white">Participants</h3>
                                <span className="bg-gray-800 text-gray-300 px-4 py-2 rounded-full text-sm font-bold">
                  {groupData.members.length} {groupData.members.length === 1 ? 'Member' : 'Members'}
                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupData.members.map((member) => (
                                    <div
                                        key={member.email}
                                        className="bg-black/30 border border-gray-800 p-4 rounded-xl flex items-center gap-4 hover:border-red-700/50 transition group"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white group-hover:text-red-400 transition">
                                                {member.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                        </div>
                                        {member.email === groupData.organizer && (
                                            <span className="bg-yellow-900/30 text-yellow-400 border border-yellow-700 px-2 py-1 rounded text-xs font-bold">
                        HOST
                      </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
