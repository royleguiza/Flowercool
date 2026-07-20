import React, { useState } from 'react';
import { Flower, Trophy, Award, ShoppingBag, ShieldAlert, Sparkles, Flame, Coins, CheckCircle, Clock, Play } from 'lucide-react';
import { UserProfile, Achievement, Accessory } from '../types';

interface MainMenuProps {
  profile: UserProfile;
  achievements: Achievement[];
  accessories: Accessory[];
  onStartGame: (username: string, mode: 'solo' | 'coop') => void;
  onSelectSkin: (id: string) => void;
  onSelectAccessory: (id: string) => void;
  onBuyItem: (item: Accessory) => void;
  onClaimAchievement: (id: string) => void;
  isConnecting: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  achievements,
  accessories,
  onStartGame,
  onSelectSkin,
  onSelectAccessory,
  onBuyItem,
  onClaimAchievement,
  isConnecting,
}) => {
  const [username, setUsername] = useState(profile.username || 'apocalipto');
  const [activeTab, setActiveTab] = useState<'lobby' | 'shop' | 'achievements' | 'events'>('lobby');

  const handleStartGameClick = (mode: 'solo' | 'coop') => {
    if (!username.trim()) return;
    onStartGame(username.trim(), mode);
  };

  // Static high score list (combining persistent user profile score dynamically)
  const mockLeaderboardPairs = [
    { name: 'SolarBloom_Pro', score: 18500, skin: '#fbbf24', level: 12 },
    { name: 'apocalipto-gaming', score: Math.max(14200, profile.highScore), skin: '#ef4444', level: 10 },
    { name: 'RoyalRose-99', score: 12400, skin: '#f472b6', level: 9 },
    { name: 'NectarEater', score: 9800, skin: '#10b981', level: 7 },
    { name: 'GardenBeast', score: 6200, skin: '#a855f7', level: 5 },
  ];

  return (
    <div id="main-lobby-menu" className="w-full flex flex-col md:flex-row gap-5 p-4 md:p-6 bg-slate-900 rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden min-h-[580px] text-slate-100">
      
      {/* Sidebar navigation */}
      <div className="w-full md:w-56 flex md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-800/60 pb-4 md:pb-0 md:pr-5 scrollbar-none overflow-x-auto">
        <div className="hidden md:flex items-center gap-3 px-3 py-4 mb-4 border-b border-slate-800/50">
          <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">
            <Flower className="w-5 h-5 text-indigo-400 animate-[spin_10s_linear_infinite]" />
          </div>
          <div>
            <h1 className="font-extrabold text-[15px] tracking-tight text-white leading-tight">Flowercool.io 2</h1>
            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest leading-none">v2.0 Beta</span>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('lobby')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap focus:outline-none ${
            activeTab === 'lobby' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Game Lobby
        </button>

        <button
          onClick={() => setActiveTab('shop')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap focus:outline-none ${
            activeTab === 'shop' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Accessory Shop
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap focus:outline-none ${
            activeTab === 'achievements' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Award className="w-4 h-4" /> Achievements
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap focus:outline-none ${
            activeTab === 'events' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Clock className="w-4 h-4" /> Weekly Events
        </button>

        {/* Currency summary block */}
        <div className="hidden md:flex flex-col gap-1 items-start bg-slate-950/40 p-4 rounded-xl border border-slate-800 mt-auto">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">WALLET BALANCE</span>
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
            <Coins className="w-4.5 h-4.5" />
            <span>{profile.coins.toLocaleString()}</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-1">Level Progress: <strong className="text-white">Lv.{profile.level}</strong></span>
        </div>
      </div>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col pt-3 md:pt-0 min-h-[300px]">
        {activeTab === 'lobby' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Quick stats banner */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-950/20 p-3.5 rounded-xl border border-slate-800 flex flex-col text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Personal Rank</span>
                <span className="text-white font-black text-sm mt-1">#2 Streamer Rank</span>
              </div>
              <div className="bg-slate-950/20 p-3.5 rounded-xl border border-slate-800 flex flex-col text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase">All-time High Score</span>
                <span className="text-indigo-400 font-mono font-bold text-sm mt-1">{profile.highScore.toLocaleString()} pts</span>
              </div>
              <div className="hidden md:flex bg-slate-950/20 p-3.5 rounded-xl border border-slate-800 flex flex-col text-left">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Current Level</span>
                <span className="text-emerald-400 font-black text-sm mt-1">Level {profile.level} ({profile.xp} XP)</span>
              </div>
            </div>

            {/* Middle Spawn Form */}
            <div className="bg-slate-950/15 p-5 rounded-2xl border border-slate-800/40 flex flex-col md:flex-row gap-5 items-center my-auto">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-4xl relative" style={{ backgroundColor: profile.equippedSkin }}>
                🌸
                {profile.equippedAccessory !== 'none' && (
                  <span className="absolute -top-3 text-lg">
                    {profile.equippedAccessory === 'crown' ? '👑' : profile.equippedAccessory === 'glasses' ? '🕶️' : profile.equippedAccessory === 'headphones' ? '🎧' : '🍃'}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2.5 w-full text-left">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Flower Pilot Name</label>
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={15}
                    placeholder="Enter pilot name..."
                    className="flex-1 bg-slate-800 hover:bg-slate-750 focus:bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Fight Game mode selectors */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                disabled={isConnecting}
                onClick={() => handleStartGameClick('solo')}
                id="mode-solo"
                className="group relative bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-2xl p-5 border border-indigo-400/20 flex flex-col items-center justify-center gap-1.5 shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="p-3 bg-white/10 rounded-xl">
                  <Flower className="w-7 h-7 text-white" />
                </div>
                <span className="font-extrabold text-sm tracking-wide">SPAWN SOLO FFA MAP</span>
                <span className="text-[10px] text-indigo-200">Deconstruct rival flowers elastically.</span>
              </button>

              <button
                disabled={isConnecting}
                onClick={() => handleStartGameClick('coop')}
                id="mode-coop"
                className="group relative bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-2xl p-5 border border-emerald-400/20 flex flex-col items-center justify-center gap-1.5 shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="p-3 bg-white/10 rounded-xl">
                  <ShieldAlert className="w-7 h-7 text-white" />
                </div>
                <span className="font-extrabold text-sm tracking-wide">SPAWN COOP SURVIVAL</span>
                <span className="text-[10px] text-emerald-250">Join teams to defeat the Great alpha weed boss.</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          // Accessory Unique Shop View
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800/65 pb-3.5 mb-4">
              <div className="text-left">
                <h3 className="font-bold text-sm text-white">Flowercool Custom Shop</h3>
                <p className="text-[10px] text-slate-500">Spend coins earned from high score battle accomplishments!</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-2 border border-slate-800 rounded-lg text-amber-400 font-bold text-xs">
                <Coins className="w-4 h-4" />
                <span>{profile.coins.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[360px] overflow-y-auto pr-1">
              {accessories.map((item) => {
                const isSkin = item.category === 'skins';
                const isUnlocked = isSkin 
                  ? profile.unlockedSkins.includes(item.id) 
                  : profile.unlockedAccessories.includes(item.id);
                const isEquipped = isSkin 
                  ? profile.equippedSkin === (item.color || '')
                  : profile.equippedAccessory === item.id;

                return (
                  <div
                    key={item.id}
                    id={`shop-item-${item.id}`}
                    className={`bg-slate-950/25 border rounded-xl p-4 flex flex-col justify-between text-left transition-all ${
                      isEquipped 
                        ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20' 
                        : isUnlocked 
                          ? 'border-slate-800 bg-slate-900/30' 
                          : 'border-slate-800/60 hover:border-slate-700/50'
                    }`}
                  >
                    <div>
                      {/* Thumbnail frame representer */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mb-2 flex-shrink-0" style={{ backgroundColor: isSkin ? item.color : '#1e293b' }}>
                        {isSkin ? '🌸' : item.id === 'crown' ? '👑' : item.id === 'glasses' ? '🕶️' : item.id === 'headphones' ? '🎧' : '🍃'}
                      </div>
                      <h4 className="font-bold text-xs text-white leading-tight">{item.name}</h4>
                      <p className="text-[9.5px] text-slate-500 leading-snug mt-1">{item.description}</p>
                    </div>

                    <div className="mt-3">
                      {isEquipped ? (
                        <span className="w-full text-center block text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 py-1.5 rounded-lg border border-emerald-400/20">
                          Equipped
                        </span>
                      ) : isUnlocked ? (
                        <button
                          id={`equip-btn-${item.id}`}
                          onClick={() => isSkin ? onSelectSkin(item.color || '') : onSelectAccessory(item.id)}
                          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold text-white transition-all focus:outline-none"
                        >
                          Equip Item
                        </button>
                      ) : (
                        <button
                          id={`buy-btn-${item.id}`}
                          onClick={() => onBuyItem(item)}
                          disabled={profile.coins < item.cost}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-lg text-[10px] font-extrabold text-white flex items-center justify-center gap-1 shadow-sm transition-all focus:outline-none cursor-pointer"
                        >
                          <Coins className="w-3 h-3" /> Buy: {item.cost}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          // Achievements milestones checklist
          <div className="flex-1 flex flex-col">
            <div className="text-left border-b border-slate-800/65 pb-3.5 mb-4">
              <h3 className="font-bold text-sm text-white">Achievements</h3>
              <p className="text-[10px] text-slate-500">Defeat game objectives, play co-op, and gain massive coin cashbacks.</p>
            </div>

            <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  id={`ach-item-${ach.id}`}
                  className={`bg-slate-950/20 border rounded-xl p-3.5 flex items-center justify-between text-left transition-all ${
                    ach.completed 
                      ? 'border-indigo-500/30 bg-indigo-500/5' 
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-white">{ach.title}</h4>
                      {ach.completed && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{ach.description}</p>
                    
                    {/* Progress tracking line */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                        <div 
                          className="bg-indigo-500 h-full rounded-full" 
                          style={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-medium text-slate-400">
                        {ach.progress}/{ach.target}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-[9px] text-amber-400 font-mono font-bold flex items-center gap-0.5 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/20">
                      +{ach.reward} Coins
                    </span>
                    {ach.completed && !ach.claimed ? (
                      <button
                        id={`claim-ach-btn-${ach.id}`}
                        onClick={() => onClaimAchievement(ach.id)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-extrabold rounded-lg text-white transition-all shadow-md cursor-pointer focus:outline-none"
                      >
                        Claim Reward
                      </button>
                    ) : ach.claimed ? (
                      <span className="text-[10px] text-slate-500 italic block font-medium">Claimed</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold block bg-slate-800/40 px-2 py-1 rounded">Locked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          // Weekly Calendar Event Module
          <div className="flex-1 flex flex-col text-left">
            <div className="border-b border-slate-800/65 pb-3.5 mb-4">
              <h3 className="font-bold text-sm text-white">Weekly Special Events</h3>
              <p className="text-[10px] text-slate-500">Temporary rules and modifiers for global lobbies.</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/30 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="bg-red-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                    <Flame className="w-3 h-3" /> Live Now
                  </span>
                  <span className="text-[10.5px] text-indigo-300 font-mono">Starts June 11 - June 18</span>
                </div>
                <h4 className="font-black text-sm tracking-tight text-white">Weed Hunter: Alpha Extinction Week</h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  Team up in COOP Survival Mode! Slaying the Giant Alpha Weed award triggers <strong className="text-amber-400">DOUBLE Coins (+300)</strong> and triple XP progress towards your total account level! Special event map spawns double pollen gems!
                </p>
                <div className="mt-4 flex gap-x-5 text-[11px] text-indigo-200">
                  <span>🎯 Mode Type: <strong>Co-op Survival</strong></span>
                  <span>🏆 Extra Rewards: <strong>300 Coins + 600 XP</strong></span>
                </div>
              </div>

              <button
                id="spawn-event-btn"
                onClick={() => handleStartGameClick('coop')}
                className="w-full md:w-auto px-5 py-3.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-extrabold text-xs tracking-wider rounded-xl hover:opacity-90 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
              >
                <Play className="w-4 h-4" /> PLAY EVENT MAP NOW
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
