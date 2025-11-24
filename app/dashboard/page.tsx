"use client";
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, doc, getDoc, updateDoc, arrayUnion, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import DotGrid from '@/components/DotGrid';
import ChromaGrid from '@/components/ChromaGrid';

interface GroupHistoryItem {
    id: string;
    name: string;
    organizerName: string;
    status: 'open' | 'generated';
    myMatch: string | null;
}

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [groupName, setGroupName] = useState('');
    const [joinId, setJoinId] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [myGroups, setMyGroups] = useState<GroupHistoryItem[]>([]);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user?.email) return;
        const fetchHistory = async () => {
            try {
                const q = query(collection(db, "groups"), where("memberEmails", "array-contains", user.email));
                const querySnapshot = await getDocs(q);
                const groupsList: GroupHistoryItem[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const match = (data.status === 'generated' && data.assignments) ? data.assignments[user.email!] : null;
                    groupsList.push({
                        id: doc.id,
                        name: data.name,
                        organizerName: data.organizerName || data.organizer,
                        status: data.status,
                        myMatch: match
                    });
                });
                setMyGroups(groupsList);
            } catch (e) { console.error(e); }
        };
        fetchHistory();
    }, [user]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || !user?.email || !user?.displayName) return;
        setIsCreating(true);
        try {
            const docRef = await addDoc(collection(db, "groups"), {
                name: groupName,
                organizer: user.email,
                organizerName: user.displayName,
                members: [{ email: user.email, name: user.displayName }],
                memberEmails: [user.email],
                assignments: {},
                status: 'open',
                createdAt: new Date()
            });
            router.push(`/group/${docRef.id}`);
        } catch (e) {
            console.error(e);
            alert("Failed to create group.");
            setIsCreating(false);
        }
    };

    const handleJoinGroup = async () => {
        if (!joinId.trim() || !user?.email || !user?.displayName) return;
        setIsJoining(true);
        try {
            const groupRef = doc(db, "groups", joinId.trim());
            const groupSnap = await getDoc(groupRef);

            if (groupSnap.exists()) {
                const data = groupSnap.data();

                if (data.status === 'generated') {
                    alert("🚫 Sorry! The Secret Santa draw has already happened for this group.");
                    setIsJoining(false);
                    return;
                }

                if (!data.memberEmails.includes(user.email)) {
                    await updateDoc(groupRef, {
                        members: arrayUnion({ email: user.email, name: user.displayName }),
                        memberEmails: arrayUnion(user.email)
                    });
                }
                router.push(`/group/${joinId.trim()}`);
            } else {
                alert("Group not found!");
                setIsJoining(false);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to join group.");
            setIsJoining(false);
        }
    };

    // Convert groups to ChromaGrid format
    const historyItems = myGroups.map((group) => ({
        image: group.status === 'generated'
            ? "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop" // Christmas tree for completed
            : "https://images.unsplash.com/photo-1545048702-79362596cdc9?w=400&h=400&fit=crop", // Gift box for open
        title: group.name,
        subtitle: group.status === 'generated'
            ? `You got: ${group.myMatch || 'Not assigned'}`
            : "Waiting for draw...",
        handle: `👤 Organized by ${group.organizerName}`,
        borderColor: group.status === 'generated' ? "#22c55e" : "#3b82f6",
        gradient: group.status === 'generated'
            ? "linear-gradient(145deg, #22c55e, #000)"
            : "linear-gradient(180deg, #3b82f6, #000)",
        onClick: () => router.push(`/group/${group.id}`)
    }));

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <p className="text-white">Loading...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white font-sans pb-10 relative overflow-hidden">
            {/* Interactive DotGrid Background */}
            <div className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                <DotGrid
                    dotSize={8}
                    gap={20}
                    baseColor="#dc2626"
                    activeColor="#22c55e"
                    proximity={150}
                    shockRadius={300}
                    shockStrength={6}
                    resistance={800}
                    returnDuration={1.8}
                />
            </div>

            {/* Header */}
            <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-20 relative">
                <h1 className="text-xl font-bold text-red-500 tracking-tight">🎅 Secret Santa</h1>
                <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:inline">
            Hello, <span className="font-semibold text-white">{user?.displayName || 'User'}</span>
          </span>
                    <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 font-medium border border-red-900 px-3 py-1 rounded hover:bg-red-950 transition">
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto mt-10 p-6 space-y-12 relative z-10">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-2">Dashboard</h2>
                    <p className="text-gray-400">Manage your Secret Santa groups here.</p>
                </div>

                {/* Interactive Action Cards */}
                <div className="grid md:grid-cols-2 gap-8 mt-12">

                    {/* Create Group Card */}
                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-800 rounded-2xl blur-lg opacity-25 group-hover:opacity-75 transition duration-300"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-red-900/50 p-8 rounded-2xl shadow-2xl hover:shadow-red-900/50 transition duration-300">
                            <div className="mb-6">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg shadow-red-900/50">
                                    🎁
                                </div>
                                <h3 className="text-2xl font-bold text-white text-center mb-2">Create New Group</h3>
                                <p className="text-gray-400 text-center text-sm">Start a Secret Santa exchange</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Group Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Office Party 2025"
                                        className="w-full p-4 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                                        onChange={(e) => setGroupName(e.target.value)}
                                        disabled={isCreating}
                                        value={groupName}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={isCreating || !groupName.trim()}
                                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 ${
                                        isCreating || !groupName.trim()
                                            ? "bg-red-900/30 cursor-not-allowed"
                                            : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-red-900/50 transform hover:scale-[1.02]"
                                    }`}
                                >
                                    {isCreating ? (
                                        <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                                    ) : "Create & Start Organizing"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Join Group Card */}
                    <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-green-800 rounded-2xl blur-lg opacity-25 group-hover:opacity-75 transition duration-300"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-green-900/50 p-8 rounded-2xl shadow-2xl hover:shadow-green-900/50 transition duration-300">
                            <div className="mb-6">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg shadow-green-900/50">
                                    🤝
                                </div>
                                <h3 className="text-2xl font-bold text-white text-center mb-2">Join Existing Group</h3>
                                <p className="text-gray-400 text-center text-sm">Enter the invite code</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">Group ID</label>
                                    <input
                                        type="text"
                                        placeholder="Paste group code here"
                                        className="w-full p-4 bg-black/50 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition font-mono"
                                        onChange={(e) => setJoinId(e.target.value)}
                                        disabled={isJoining}
                                        value={joinId}
                                    />
                                </div>
                                <button
                                    onClick={handleJoinGroup}
                                    disabled={isJoining || !joinId.trim()}
                                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-300 ${
                                        isJoining || !joinId.trim()
                                            ? "bg-green-900/30 cursor-not-allowed"
                                            : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-green-900/50 transform hover:scale-[1.02]"
                                    }`}
                                >
                                    {isJoining ? (
                                        <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Joining...
                    </span>
                                    ) : "Join Group"}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* History Section with ChromaGrid */}
                <div className="mt-20">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Your Groups History</h2>

                    {myGroups.length === 0 ? (
                        <p className="text-gray-500 text-center py-12 bg-gray-900/30 backdrop-blur-sm rounded-lg border border-gray-800 border-dashed">
                            You haven't joined any Secret Santa groups yet.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myGroups.map((group) => (
                                <div
                                    key={group.id}
                                    onClick={() => router.push(`/group/${group.id}`)}
                                    className="group relative cursor-pointer"
                                >
                                    {/* Glow Effect */}
                                    <div className={`absolute -inset-1 rounded-2xl blur-lg opacity-25 group-hover:opacity-75 transition duration-300 ${
                                        group.status === 'generated'
                                            ? 'bg-gradient-to-r from-green-600 to-green-800'
                                            : 'bg-gradient-to-r from-blue-600 to-blue-800'
                                    }`}></div>

                                    {/* Card */}
                                    <div className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 rounded-2xl shadow-2xl transition duration-300 border ${
                                        group.status === 'generated'
                                            ? 'border-green-900/50 hover:shadow-green-900/50'
                                            : 'border-blue-900/50 hover:shadow-blue-900/50'
                                    }`}>

                                        {/* Image */}
                                        <div className="mb-4 overflow-hidden rounded-xl">
                                            <img
                                                src={group.status === 'generated'
                                                    ? "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop"
                                                    : "https://images.unsplash.com/photo-1545048702-79362596cdc9?w=400&h=400&fit=crop"
                                                }
                                                alt={group.name}
                                                className="w-full h-48 object-cover group-hover:scale-110 transition duration-500"
                                            />
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  group.status === 'generated'
                      ? 'bg-green-900/50 text-green-400 border border-green-700'
                      : 'bg-blue-900/50 text-blue-400 border border-blue-700'
              }`}>
                {group.status === 'generated' ? '🎄 DRAW COMPLETE' : '⏳ OPEN'}
              </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition">
                                            {group.name}
                                        </h3>

                                        {/* Subtitle */}
                                        <p className={`text-sm mb-3 ${
                                            group.status === 'generated' ? 'text-green-400' : 'text-gray-400'
                                        }`}>
                                            {group.status === 'generated'
                                                ? `You got: ${group.myMatch || 'Not assigned'}`
                                                : "Waiting for draw..."}
                                        </p>

                                        {/* Organizer */}
                                        <p className="text-xs text-gray-500">
                                            👤 Organized by {group.organizerName}
                                        </p>

                                        {/* Hover Arrow */}
                                        <div className="mt-4 flex items-center justify-between text-gray-400 group-hover:text-white transition">
                                            <span className="text-sm font-medium">View Details</span>
                                            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
