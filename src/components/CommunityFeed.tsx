import React, { useState, useEffect, useRef } from 'react';
import { Youtube, Heart, MessageSquare, Send, Video, Share2, Award, User, Flame } from 'lucide-react';
import { CommunityPost } from '../types';

interface CommunityFeedProps {
  userId: string;
  username: string;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  userId,
  username,
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostText, setNewPostText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'feed' | 'stream'>('feed');

  // Streaming state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamViews, setStreamViews] = useState<number>(0);
  const [streamDuration, setStreamDuration] = useState<number>(0);
  const [streamTitle, setStreamTitle] = useState<string>('CREATING FLOWERCOOL.IO 2 IN MY CHANNEL! NEW BOSS UPDATE 🌸🎥');
  const [streamComments, setStreamComments] = useState<{ author: string; text: string; id: string }[]>([]);

  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);
  const commentTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial posts from Node Express backend
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Failed to load community publications:', err);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: userId,
          authorName: username,
          authorAvatar: '🌸',
          content: newPostText.trim(),
          type: 'post'
        })
      });

      if (res.ok) {
        const createdPost = await res.json();
        setPosts([createdPost, ...posts]);
        setNewPostText('');
      }
    } catch (err) {
      console.error('Failed to post communication:', err);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(p => p.postId === postId ? { ...p, likesCount: data.likesCount } : p));
      }
    } catch (err) {
      console.error('Failed to register like:', err);
    }
  };

  // Streaming Live Simulation Loops
  useEffect(() => {
    if (isStreaming) {
      // 1. Live stream duration and audience counter
      streamTimerRef.current = setInterval(() => {
        setStreamDuration(prev => prev + 1);
        setStreamViews(() => {
          // Accelerate viewers gradually to simulate YouTube hype!
          const mult = Math.floor(Math.random() * 80) + 10;
          return Math.min(48000, 120 + mult * (streamDuration + 1));
        });
      }, 1000);

      const fanNames = [
        'apocalipto_fan', 'GamerDeFlores', 'FlowerBattleLord', 'Rubius_Nectar', 
        'VeguetaSim', 'IbizaRose', 'PollenMaster', 'Aura_Sakura', 'CoolPetalGuy',
        'MinecraftBloom', 'Gamer777', 'EstrellaGaming'
      ];
      
      const fanComments = [
        '¡Increíble juego! La física fluida se siente de locos 🚀',
        'This matches are so intense, cool accessories!',
        'No way, the gold sunflower skin is insanely gorgeous 🌻✨',
        'apocalipto podés mandarle un saludo a mi hermanito?',
        'BEAT THAT alpha weed boss! Go left side!',
        'Que juego tan lindo, se parece a Flowercool pero mucho mejor.',
        'Wait, did you code this live? Elite skills!',
        'Amo el modo oscuro nativo, mis ojos lo agradecen.',
        '¿Cómo compro la skin de rosa real? Está épica.',
        'Subscribing immediately! Best gaming stream of the week.'
      ];

      // 2. Continuous live chat commenter messages
      commentTimerRef.current = setInterval(() => {
        const newComm = {
          id: `fanc-${Math.random()}`,
          author: fanNames[Math.floor(Math.random() * fanNames.length)],
          text: fanComments[Math.floor(Math.random() * fanComments.length)]
        };
        setStreamComments(prev => [...prev.slice(-25), newComm]);
      }, 1400);

    } else {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      if (commentTimerRef.current) clearInterval(commentTimerRef.current);
      setStreamComments([]);
    }

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
      if (commentTimerRef.current) clearInterval(commentTimerRef.current);
    };
  }, [isStreaming, streamDuration]);

  const handleStartStream = () => {
    setIsStreaming(!isStreaming);
    if (!isStreaming) {
      setStreamDuration(0);
      setStreamViews(112);
    }
  };

  const getFormattedTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="creator-community-center" className="bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl text-slate-100">
      
      {/* Navigation tabs */}
      <div className="bg-slate-950/70 py-1 border-b border-slate-800/60 flex text-xs">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-3 font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'feed'
              ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/5'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
          }`}
        >
          <Youtube className="w-4 h-4 text-red-500" />
          Community Board
        </button>
        <button
          onClick={() => setActiveTab('stream')}
          className={`flex-1 py-3 font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'stream'
              ? 'text-white border-b-2 border-indigo-500 bg-indigo-500/5'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
          }`}
        >
          <Video className="w-4 h-4 text-emerald-400" />
          Creator Streaming Deck
        </button>
      </div>

      {activeTab === 'feed' ? (
        // Feed View
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Post submission block */}
          <form onSubmit={handlePostSubmit} className="p-4 border-b border-slate-800/40 bg-slate-950/20 flex flex-col gap-2">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="What streaming plans or strategies do you have for Flowercool.io 2? Share it with followers..."
              rows={2}
              className="w-full bg-slate-800 hover:bg-slate-750 focus:bg-slate-900 border border-slate-700/50 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none resize-none transition-all"
            />
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-medium">✨ Use appropriate flower tags for social feeds.</span>
              <button
                type="submit"
                id="submit-feed-btn"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-505 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1 focus:outline-none transition-all"
              >
                <Send className="w-3.5 h-3.5" /> Publish Post
              </button>
            </div>
          </form>

          {/* Scrolling Feed Post Lists */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {posts.map((post) => (
              <div 
                key={post.postId} 
                id={`announcement-post-${post.postId}`}
                className="bg-slate-850/40 rounded-xl border border-slate-800/50 p-4 shadow-sm hover:border-slate-700/40 transition-all"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-base">
                    {post.authorAvatar}
                  </span>
                  <div>
                    <span className="font-bold text-xs text-white flex items-center gap-1">
                      {post.authorName}
                      {post.authorId === 'creator-apocalipto' && (
                        <span className="text-[9px] bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded ml-1 uppercase tracking-widest flex items-center gap-0.5">
                          <Youtube className="w-2.5 h-2.5" /> Streamer
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap mb-3.5">
                  {post.content}
                </p>

                <div className="flex items-center gap-x-4 border-t border-slate-800/40 pt-3 text-[11px] text-slate-400">
                  <button 
                    id={`like-post-btn-${post.postId}`}
                    onClick={() => handleLikePost(post.postId)}
                    className="flex items-center gap-1.5 hover:text-red-400 transition-colors group focus:outline-none cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 group-hover:scale-110 text-red-500 fill-red-500 transition-transform" />
                    <span>{post.likesCount} Likes</span>
                  </button>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Comments Enabled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Creator Streaming Simulator View
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          
          {/* Header controls for stream details */}
          <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850 flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">YouTube Streaming Topic / Metadata</label>
              <input
                type="text"
                value={streamTitle}
                disabled={isStreaming}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Ex. FLOWECOOL 2 INTENSE MULTIPLAYER GAMEPLAY"
                className="bg-slate-900 border border-slate-700/40 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-60"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleStartStream}
                id="start-stream-action"
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${
                  isStreaming 
                    ? 'bg-red-600 hover:bg-red-500 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Video className="w-4 h-4 animate-pulse" />
                {isStreaming ? 'STOP STREAMING (GO OFFLINE)' : 'GO LIVE ON YOUTUBE (STREAM GAME)'}
              </button>
            </div>
          </div>

          {/* Active Streaming Dash Screen */}
          {isStreaming ? (
            <div className="flex-1 flex flex-col md:flex-row gap-3 overflow-hidden mt-4">
              
              {/* Simulated video playback screen */}
              <div className="flex-1 bg-black border border-slate-800 rounded-xl flex flex-col items-center justify-center relative p-4 h-[180px] md:h-auto overflow-hidden">
                <div className="absolute top-3 left-3 flex gap-2 z-10">
                  <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded tracking-widest flex items-center gap-1 uppercase">
                    <Flame className="w-3 h-3" /> Live
                  </span>
                  <span className="bg-black/60 backdrop-blur-sm text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded">
                    {getFormattedTime(streamDuration)}
                  </span>
                </div>

                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded z-10 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  {streamViews.toLocaleString()} Watching
                </div>

                {/* Animated spectrum vectors inside playback */}
                <div className="flex items-center gap-1.5 h-20">
                  {Array.from({ length: 15 }).map((_, idx) => (
                    <span 
                      key={idx} 
                      className="w-1.5 h-full rounded bg-red-500 transition-all"
                      style={{ 
                        height: `${Math.floor(Math.sin((streamDuration * 1.5) + idx) * 35) + 45}%`,
                        opacity: 0.82 - (idx * 0.03)
                      }}
                    />
                  ))}
                </div>

                <div className="text-center absolute bottom-4">
                  <p className="text-[11px] font-mono font-bold text-red-500 tracking-wider">YOUTUBE FEED BROADCAST ONLINE</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Capturing live flower physics & accessory skins...</p>
                </div>
              </div>

              {/* YouTube Live Comment Feed Chat */}
              <div className="w-full md:w-56 bg-slate-950/45 border border-slate-800/60 rounded-xl flex flex-col overflow-hidden h-[180px] md:h-auto">
                <div className="bg-slate-950 px-3 py-2 border-b border-slate-850 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live YouTube Chats</span>
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                </div>

                <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5">
                  {streamComments.map((comm) => (
                    <div key={comm.id} className="text-[11px] leading-relaxed">
                      <span className="font-bold text-indigo-300 mr-1.5">{comm.author}:</span>
                      <span className="text-slate-200">{comm.text}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 mt-4 border-2 border-dashed border-slate-800 rounded-xl">
              <Youtube className="w-16 h-16 text-slate-700 mb-2" />
              <p className="text-white font-bold text-sm">Become a YouTube Star Streamer!</p>
              <p className="text-slate-400 text-xs mt-1.5 max-w-xs leading-relaxed">
                Kick off an interactive live simulation! Share the minimalist flower matches, achievements, and shop accessories to increase viewers and earn follower accolades!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
