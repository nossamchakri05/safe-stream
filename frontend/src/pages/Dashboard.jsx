import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import useSocket from '../hooks/useSocket';
import {
    Upload, Play, Shield, ShieldAlert, Clock, Filter, LogOut,
    Video, Users, Settings, Trash2, Globe, Search, SortAsc,
    ChevronRight, LayoutDashboard, FileVideo, AlertCircle, Building2
} from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [videos, setVideos] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [filter, setFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('videos');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [title, setTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const socket = useSocket(user?.tenantId || 'global_admin');

    useEffect(() => {
        fetchVideos();
        if (user?.role === 'Admin') {
            fetchUsers();
        }
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        socket.on('videoProgress', ({ videoId, progress, status }) => {
            setVideos(prev => prev.map(v =>
                v._id === videoId ? { ...v, processingProgress: progress, status } : v
            ));
        });

        socket.on('videoComplete', ({ videoId, sensitivityStatus, status }) => {
            setVideos(prev => prev.map(v =>
                v._id === videoId ? { ...v, sensitivityStatus, status } : v
            ));
        });

        return () => {
            socket.off('videoProgress');
            socket.off('videoComplete');
        };
    }, [socket]);

    const fetchVideos = async () => {
        try {
            const response = await api.get('/videos');
            setVideos(response.data);
        } catch (err) {
            console.error('Failed to fetch videos');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users');
        }
    };

    const handleDeleteVideo = async (videoId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this video?')) return;
        try {
            await api.delete(`/videos/${videoId}`);
            setVideos(prev => prev.filter(v => v._id !== videoId));
        } catch (err) {
            alert('Failed to delete video');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title || file.name);

        setUploading(true);
        setUploadProgress(0);

        try {
            await api.post('/videos/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
            setTitle('');
            fetchVideos();
        } catch (err) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const filteredVideos = videos
        .filter(v => {
            const matchesFilter =
                filter === 'all' ||
                (filter === 'safe' && v.sensitivityStatus === 'Safe') ||
                (filter === 'flagged' && v.sensitivityStatus === 'Flagged');

            const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesFilter && matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortBy === 'size') return b.size - a.size;
            return 0;
        });

    return (
        <div className="min-h-screen pb-20">
            {selectedVideo && (
                <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
            )}

            {/* Navigation Bar */}
            <nav className="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 mb-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Video className="text-white" size={20} />
                            </div>
                            <span className="text-xl font-bold text-white font-display">Safe <span className="text-indigo-400">Stream</span></span>
                        </div>

                        {user?.role === 'Admin' && (
                            <div className="hidden md:flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('videos')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'videos' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Library
                                </button>
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Users
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right mr-2">
                            <p className="text-sm font-semibold text-white">{user?.username}</p>
                            <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">
                                {user?.role === 'Admin' ? 'Global Admin' : user?.tenantName}
                            </p>
                        </div>
                        <button onClick={logout} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl transition-all duration-300">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Sidebar Controls */}
                    <aside className="lg:col-span-3 space-y-6">
                        {activeTab === 'videos' && (
                            <>
                                {user?.role !== 'Viewer' && (
                                    <div className="glass-card !p-6">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                                            <Upload size={18} className="text-indigo-400" />
                                            Upload Content
                                        </h3>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="Video Title"
                                                className="input-field !py-2.5 text-sm"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                            <label className={`block w-full group ${!title ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                                <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${!title ? 'border-slate-800' : 'border-slate-700 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5'}`}>
                                                    <FileVideo className={`mx-auto mb-3 transition-colors duration-300 ${!title ? 'text-slate-700' : 'text-slate-500 group-hover:text-indigo-400'}`} size={32} />
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        {!title ? 'Enter title first' : 'Drop video here'}
                                                    </p>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="video/*"
                                                        onChange={handleUpload}
                                                        disabled={uploading || !title}
                                                    />
                                                </div>
                                            </label>
                                            {uploading && (
                                                <div className="pt-2">
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                                                        <span className="text-slate-500">Uploading</span>
                                                        <span className="text-indigo-400">{uploadProgress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="glass-card !p-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                                        <Filter size={18} className="text-indigo-400" />
                                        Refine Library
                                    </h3>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Search</p>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                                <input
                                                    type="text"
                                                    placeholder="Find videos..."
                                                    className="input-field !pl-9 !py-2 text-xs"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Sort By</p>
                                            <div className="relative">
                                                <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                                <select
                                                    className="input-field !pl-9 !py-2 text-xs appearance-none cursor-pointer"
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                >
                                                    <option value="newest">Newest First</option>
                                                    <option value="oldest">Oldest First</option>
                                                    <option value="size">Largest Size</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Safety Status</p>
                                            <div className="flex flex-col gap-1">
                                                {[
                                                    { id: 'all', label: 'All Content', icon: Globe, color: 'indigo' },
                                                    { id: 'safe', label: 'Safe Only', icon: Shield, color: 'green' },
                                                    { id: 'flagged', label: 'Flagged', icon: ShieldAlert, color: 'red' }
                                                ].map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setFilter(item.id)}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${filter === item.id ? `bg-${item.color}-500/10 text-${item.color}-400` : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`}
                                                    >
                                                        <item.icon size={14} />
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </aside>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9">
                        {activeTab === 'videos' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredVideos.map(video => (
                                    <div
                                        key={video._id}
                                        onClick={() => video.status === 'Completed' && setSelectedVideo(video)}
                                        className={`glass-card !p-0 overflow-hidden group relative flex flex-col ${video.status === 'Completed' ? 'cursor-pointer' : 'opacity-80'}`}
                                    >
                                        <div className="aspect-video bg-slate-900/80 flex items-center justify-center relative overflow-hidden">
                                            {video.thumbnailPath ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${video.thumbnailPath}`}
                                                    alt={video.title}
                                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : null}

                                            {video.status === 'Completed' ? (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100 border border-white/20 relative z-10">
                                                        <Play className="text-white fill-white ml-1" size={24} />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-6 relative z-10 bg-slate-900/60 backdrop-blur-sm w-full h-full flex flex-col items-center justify-center">
                                                    <div className="relative w-16 h-16 mx-auto mb-4">
                                                        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                                        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                        <Clock className="absolute inset-0 m-auto text-indigo-400" size={24} />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Processing {video.processingProgress}%</p>
                                                </div>
                                            )}

                                            <div className="absolute top-4 left-4 flex gap-2">
                                                {video.sensitivityStatus === 'Safe' ? (
                                                    <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                                                        <Shield size={12} />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Safe</span>
                                                    </div>
                                                ) : video.sensitivityStatus === 'Flagged' ? (
                                                    <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-lg">
                                                        <ShieldAlert size={12} />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Flagged</span>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {(user?.role === 'Admin' || (user?.role === 'Editor' && (video.tenantId?._id === user.tenantId || video.tenantId === user.tenantId))) && (
                                                <button
                                                    onClick={(e) => handleDeleteVideo(video._id, e)}
                                                    className="absolute top-4 right-4 p-2 bg-slate-900/80 backdrop-blur-md border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-xl"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            <h4 className="font-bold text-white text-lg truncate mb-1 group-hover:text-indigo-400 transition-colors duration-300">{video.title}</h4>

                                            {user?.role === 'Admin' && (
                                                <div className="flex items-center gap-1.5 mb-4">
                                                    <Globe size={12} className="text-slate-500" />
                                                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                                                        {video.tenantId?.name || 'System'}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Size</span>
                                                    <span className="text-xs text-slate-300 font-medium">{(video.size / (1024 * 1024)).toFixed(1)} MB</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</span>
                                                    <p className={`text-xs font-bold ${video.status === 'Completed' ? 'text-green-400' : 'text-amber-400'}`}>
                                                        {video.status}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredVideos.length === 0 && (
                                    <div className="col-span-full py-32 glass-card flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-6 border border-white/5">
                                            <AlertCircle className="text-slate-600" size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">No videos found</h3>
                                        <p className="text-slate-500 max-w-xs">We couldn't find any videos matching your current filters or search query.</p>
                                        <button onClick={() => { setFilter('all'); setSearchQuery(''); }} className="mt-6 text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition-colors">
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* User Management View (Admin Only) */
                            <div className="glass-card !p-0 overflow-hidden">
                                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/20">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                            <Users className="text-indigo-400" />
                                            User Directory
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">Manage system access and organization roles</p>
                                    </div>
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl">
                                        <span className="text-indigo-400 font-bold text-sm">{users.length} Total Users</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold border-b border-white/5">
                                                <th className="px-8 py-5">User Identity</th>
                                                <th className="px-8 py-5">System Role</th>
                                                <th className="px-8 py-5">Organization</th>
                                                <th className="px-8 py-5">Registration</th>
                                                <th className="px-8 py-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {users.map(u => (
                                                <tr key={u._id} className="text-sm text-slate-300 hover:bg-white/[0.02] transition-all group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-white font-bold">
                                                                {u.username?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white">{u.username}</div>
                                                                <div className="text-xs text-slate-500">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${u.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                            u.role === 'Editor' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                'bg-slate-800 text-slate-400 border border-white/5'
                                                            }`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Building2 size={14} className="text-slate-600" />
                                                            {u.tenantId?.name || <span className="text-slate-600 italic font-medium">System</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-slate-500 font-medium">
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {u._id !== user._id ? (
                                                            <button
                                                                onClick={() => handleDeleteUser(u._id)}
                                                                className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest mr-2">You</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
