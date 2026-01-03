import React from 'react';
import { X, Shield, ShieldAlert, FileVideo, Download, Share2, Maximize2 } from 'lucide-react';

const VideoPlayer = ({ video, onClose }) => {
    if (!video) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#020617]/90 backdrop-blur-2xl"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl glass rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)] border border-white/10 animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col lg:flex-row h-full">

                    {/* Video Section */}
                    <div className="flex-1 bg-black relative group">
                        <video
                            controls
                            className="w-full h-full aspect-video object-contain"
                            autoPlay
                            src={`http://${window.location.hostname}:5000/api/videos/stream/${video._id}?token=${localStorage.getItem('token')}`}
                        >
                            Your browser does not support the video tag.
                        </video>

                        {/* Overlay Info */}
                        <div className="absolute top-6 left-6 flex gap-3 pointer-events-none">
                            {video.sensitivityStatus === 'Safe' ? (
                                <div className="bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xl">
                                    <Shield size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Verified Safe</span>
                                </div>
                            ) : (
                                <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xl">
                                    <ShieldAlert size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Content Flagged</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="w-full lg:w-80 bg-slate-900/50 backdrop-blur-md p-8 flex flex-col border-l border-white/5">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                <FileVideo size={24} />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white mb-2 font-display">{video.title}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                {video.description || 'No description provided for this video content.'}
                            </p>

                            <div className="space-y-6">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Technical Specs</span>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Size</p>
                                            <p className="text-sm text-white font-semibold">{(video.size / (1024 * 1024)).toFixed(1)} MB</p>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Format</p>
                                            <p className="text-sm text-white font-semibold">{video.mimetype.split('/')[1].toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Metadata</span>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">Resolution</span>
                                            <span className="text-xs text-white font-medium">{video.metadata?.resolution || '1080p'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">Codec</span>
                                            <span className="text-xs text-white font-medium">{video.metadata?.codec || 'H.264'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5 flex gap-3">
                            <button className="flex-1 bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10">
                                <Download size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider">Save</span>
                            </button>
                            <button className="flex-1 bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10">
                                <Share2 size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider">Share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
