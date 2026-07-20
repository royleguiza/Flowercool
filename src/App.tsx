import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { UserProfile, Achievement, Accessory, GamePlayer, GamePetal, GamePollen, GameBoss, VoiceMessage } from './types';
import { MainMenu } from './components/MainMenu';
import { GameCanvas } from './game/GameCanvas';
import { VoiceChat } from './components/VoiceChat';
import { CommunityFeed } from './components/CommunityFeed';
import { Flower, Trophy, LogIn, Users, Award, VolumeX, Volume2, ShieldAlert } from 'lucide-react';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase with protection guards
let db: any = null;
let auth: any = null;
try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (err) {
  console.warn('Firebase initialization failed. Falling back to local storage sync.', err);
}

// Available shop items
const DEFAULT_ACCESSORIES: Accessory[] = [
  { id: 'rose', name: 'Rose Red', category: 'skins', cost: 0, color: '#ef4444', description: 'Royal rose skin. Highly visible and sleek.' },
  { id: 'sunflower', name: 'Sunflower Yellow', category: 'skins', cost: 120, color: '#fbbf24', description: 'Sunshine sunflower. Glows with golden petal outline.' },
  { id: 'orchid', name: 'Cosmic Orchid', category: 'skins', cost: 250, color: '#a855f7', description: 'Starlight orchid. Violet pigments of cosmic dust.' },
  { id: 'clover', name: 'Emerald Clover', category: 'skins', cost: 400, color: '#10b981', description: 'Lucky clover. Emerald green color scheme.' },
  { id: 'sakura', name: 'Sakura Pastel', category: 'skins', cost: 600, color: '#f472b6', description: 'Japanese spring sakura pink skin.' },
  { id: 'royal', name: 'Royal Sapphire', category: 'skins', cost: 1000, color: '#3b82f6', description: 'Legendary sapphire. Blue petal core of the oceans.' },
  
  { id: 'crown', name: 'Golden Flower Crown', category: 'accessories', cost: 150, description: 'Golden crown worn by elite flower champions.' },
  { id: 'glasses', name: 'Designer Pixel-Glasses', category: 'accessories', cost: 80, description: 'Thug-life sunglasses giving protection aura.' },
  { id: 'headphones', name: 'Neon Beats Headphones', category: 'accessories', cost: 200, description: 'Sleek headphones worn to coordinate tactics.' },
  { id: 'leaf_cape', name: 'Elven Leaf Cape', category: 'accessories', cost: 300, description: 'Cape woven from lucky leaves trailing behind your path.' },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'play_1', title: 'First Sprout', description: 'Spawn into a game lobby once.', reward: 50, progress: 0, target: 1, completed: false, claimed: false, type: 'play' },
  { id: 'eat_100', title: 'Pollen Harvester', description: 'Collect 100 colorful pollen grains.', reward: 100, progress: 0, target: 100, completed: false, claimed: false, type: 'eat' },
  { id: 'kill_1', title: 'Thorny Defeat', description: 'Knock out 1 rival flower in combat.', reward: 150, progress: 0, target: 1, completed: false, claimed: false, type: 'kill' },
  { id: 'boss_1', title: 'Weed Extirpator', description: 'Slay the Giant Weed Alpha once.', reward: 250, progress: 0, target: 1, completed: false, claimed: false, type: 'boss' },
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile>({
    userId: 'guest',
    username: 'apocalipto',
    level: 1,
    xp: 0,
    highScore: 0,
    coins: 300, // starting funds to buy some skins!
    equippedSkin: '#ef4444',
    equippedAccessory: 'none',
    unlockedSkins: ['rose'],
    unlockedAccessories: []
  });
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  
  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'defeated'>('menu');
  const [defeatStats, setDefeatStats] = useState<{ score: number; pollenEaten: number; level: number } | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // WebSocket references
  const socketRef = useRef<WebSocket | null>(null);
  const [wsPlayers, setWsPlayers] = useState<Record<string, GamePlayer>>({});
  const [wsPetals, setWsPetals] = useState<GamePetal[]>([]);
  const [wsPollens, setWsPollens] = useState<GamePollen[]>([]);
  const [wsBoss, setWsBoss] = useState<GameBoss | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<VoiceMessage[]>([]);

  // Authenticate user anonymously to Firebase or fallback
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      loadLocalProfile();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        await syncProfileFromFirestore(authUser.uid);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error('Anonymous sign in failed:', err);
          loadLocalProfile();
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loadLocalProfile = () => {
    const saved = localStorage.getItem('flowercool2_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        // use default
      }
    }
    const savedAch = localStorage.getItem('flowercool2_achievements');
    if (savedAch) {
      try {
        setAchievements(JSON.parse(savedAch));
      } catch (e) {}
    }
  };

  const saveLocalProfile = (updated: UserProfile) => {
    localStorage.setItem('flowercool2_profile', JSON.stringify(updated));
    setProfile(updated);
  };

  const saveLocalAchievements = (certs: Achievement[]) => {
    localStorage.setItem('flowercool2_achievements', JSON.stringify(certs));
    setAchievements(certs);
  };

  // Pull profile from Firestore
  const syncProfileFromFirestore = async (uid: string) => {
    if (!db) return;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
      } else {
        // Create initial default profile in firestore
        const initial: UserProfile = {
          userId: uid,
          username: `Flower-${Math.floor(Math.random() * 9000 + 1000)}`,
          level: 1,
          xp: 0,
          highScore: 0,
          coins: 300,
          equippedSkin: '#ef4444',
          equippedAccessory: 'none',
          unlockedSkins: ['rose'],
          unlockedAccessories: []
        };
        await setDoc(docRef, initial);
        setProfile(initial);
      }
      
      // Load achievements
      const achSnap = localStorage.getItem(`flowercool2_achievements_${uid}`);
      if (achSnap) {
        setAchievements(JSON.parse(achSnap));
      }
    } catch (err) {
      console.error('Firestore load error:', err);
      loadLocalProfile();
    } finally {
      setLoading(false);
    }
  };

  // Persist updated profile values to Firestore (or local storage fallback)
  const saveProfile = async (updated: UserProfile) => {
    setProfile(updated);
    if (db && user) {
      try {
        await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
        localStorage.setItem(`flowercool2_achievements_${user.uid}`, JSON.stringify(achievements));
      } catch (err) {
        console.error('Firestore save error:', err);
      }
    } else {
      saveLocalProfile(updated);
      saveLocalAchievements(achievements);
    }
  };

  // Accessory buy logic
  const handleBuyItem = (item: Accessory) => {
    if (profile.coins < item.cost) return;

    const isSkin = item.category === 'skins';
    const updated: UserProfile = {
      ...profile,
      coins: profile.coins - item.cost,
      unlockedSkins: isSkin 
        ? [...profile.unlockedSkins, item.id] 
        : profile.unlockedSkins,
      unlockedAccessories: !isSkin
        ? [...profile.unlockedAccessories, item.id]
        : profile.unlockedAccessories
    };
    saveProfile(updated);
  };

  const handleSelectSkin = (colorHex: string) => {
    const updated = { ...profile, equippedSkin: colorHex };
    saveProfile(updated);
  };

  const handleSelectAccessory = (id: string) => {
    const updated = { ...profile, equippedAccessory: id };
    saveProfile(updated);
  };

  const handleClaimAchievement = (id: string) => {
    setAchievements(prev => {
      const updated = prev.map(a => {
        if (a.id === id && a.completed && !a.claimed) {
          const upProf = { ...profile, coins: profile.coins + a.reward };
          saveProfile(upProf);
          return { ...a, claimed: true };
        }
        return a;
      });
      if (!user) {
        localStorage.setItem('flowercool2_achievements', JSON.stringify(updated));
      } else {
        localStorage.setItem(`flowercool2_achievements_${user.uid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Launch connecting to WebSocket Game engine
  const handleStartGame = (selectedUsername: string, mode: 'solo' | 'coop') => {
    setIsConnecting(true);
    
    // Update profile username
    const currentSkin = DEFAULT_ACCESSORIES.find(s => s.color === profile.equippedSkin)?.id || 'rose';
    const currentAccessory = profile.equippedAccessory;

    const updatedProfile = { ...profile, username: selectedUsername };
    saveProfile(updatedProfile);

    // Establish WebSocket connection on standard port (relative dynamically)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const socketUrl = `${protocol}//${wsHost}`;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      // Send spawn join packet
      socket.send(JSON.stringify({
        type: 'join',
        username: selectedUsername,
        skin: currentSkin,
        accessory: currentAccessory,
        mode: mode
      }));

      // Set play goal achievement progress
      setAchievements(prev => {
        const next = prev.map(a => {
          if (a.type === 'play') {
            const prog = a.progress + 1;
            return { ...a, progress: prog, completed: prog >= a.target };
          }
          return a;
        });
        return next;
      });
      setIsConnecting(false);
      setGameState('playing');
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        if (payload.type === 'init') {
          setClientId(payload.id);
        }

        if (payload.type === 'state') {
          setWsPlayers(payload.players);
          setWsPetals(payload.petals);
          setWsPollens(payload.pollens);
          setWsBoss(payload.boss);

          // Realtime progress milestones evaluations
          const localActor = payload.players[clientId];
          if (localActor) {
            setAchievements(prev => {
              return prev.map(a => {
                if (a.type === 'eat') {
                  const itemsCount = Math.floor(localActor.score / 10);
                  return { ...a, progress: itemsCount, completed: itemsCount >= a.target };
                }
                return a;
              });
            });
          }
        }

        if (payload.type === 'chat_message') {
          setChatMessages(prev => [
            ...prev,
            {
              id: `chat-${Math.random()}`,
              senderName: payload.senderName,
              text: payload.text,
              timestamp: payload.timestamp
            }
          ].slice(-50)); // cap at 50 logs
        }

        if (payload.type === 'defeat') {
          socket.close();
          handleGameDefeat(payload.stats);
        }
      } catch (err) {
        console.error('Error parsing inbound packet:', err);
      }
    };

    socket.onclose = () => {
      setGameState('menu');
      setIsConnecting(false);
    };

    socket.onerror = (err) => {
      console.error('WebSocket connection error:', err);
      setIsConnecting(false);
    };
  };

  const handleGameDefeat = (stats: { score: number; pollenEaten: number; level: number }) => {
    setDefeatStats(stats);
    setGameState('defeated');

    // Update persistent high score if greater
    if (stats.score > profile.highScore) {
      const updated = {
        ...profile,
        highScore: stats.score,
        coins: profile.coins + Math.floor(stats.score / 20)
      };
      saveProfile(updated);
    } else {
      const updated = {
        ...profile,
        coins: profile.coins + Math.floor(stats.score / 20)
      };
      saveProfile(updated);
    }
  };

  const handleSendChat = (text: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat',
        text,
      }));
    } else {
      // Offline fallback typing log
      setChatMessages(prev => [
        ...prev,
        {
          id: `chat-${Math.random()}`,
          senderName: profile.username,
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Flower className="w-12 h-12 text-indigo-400 animate-[spin_5s_linear_infinite]" />
        <p className="mt-4 font-mono text-sm tracking-widest text-indigo-300 uppercase animate-pulse">Initializing Flower Engines...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none">
      
      {/* Visual background atmospheric effects */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.04),transparent_50%)] z-0" />

      {/* Main Container Layer */}
      <main className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 relative z-10 flex-1">
        
        {/* Main Brand Header */}
        <header className="flex justify-between items-center border-b border-slate-800/40 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Flower className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="font-black text-lg md:text-xl tracking-tight leading-none text-white">Flowercool.io 2</h1>
              <p className="text-[10px] md:text-xs text-slate-400 mt-1">Sleek & Fluid Real-Time Flower Combat Arenas</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-400/20 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Lobbies Live
            </span>
          </div>
        </header>

        {gameState === 'menu' && (
          <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-1">
            {/* Main Menu Dashboard Column */}
            <div className="flex-[3] flex flex-col">
              <MainMenu
                profile={profile}
                achievements={achievements}
                accessories={DEFAULT_ACCESSORIES}
                onStartGame={handleStartGame}
                onSelectSkin={handleSelectSkin}
                onSelectAccessory={handleSelectAccessory}
                onBuyItem={handleBuyItem}
                onClaimAchievement={handleClaimAchievement}
                isConnecting={isConnecting}
              />
            </div>

            {/* Social Stream and Strategic Communication Dashboard Column */}
            <div className="flex-[2] flex flex-col gap-6">
              <CommunityFeed
                userId={profile.userId}
                username={profile.username}
              />
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch">
            {/* The active gaming visual canvas */}
            <div className="flex-[3] h-[400px] md:h-[550px] flex flex-col">
              <GameCanvas
                socket={socketRef.current}
                playerId={clientId}
                players={wsPlayers}
                petals={wsPetals}
                pollens={wsPollens}
                boss={wsBoss}
                onDefeat={handleGameDefeat}
              />
            </div>

            {/* Combined Voice-Chat / Tactics controller */}
            <div className="flex-[1.8] flex flex-col h-[350px] lg:h-auto">
              <VoiceChat
                username={profile.username}
                onSendChat={handleSendChat}
                chatMessages={chatMessages}
              />
            </div>
          </div>
        )}

        {gameState === 'defeated' && defeatStats && (
          // Playback Game Over Defeat summary panel
          <div className="my-auto max-w-xl mx-auto w-full bg-slate-900 border border-slate-800/80 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl mb-4 animate-bounce">
              🥀
            </div>
            
            <h2 className="font-extrabold text-xl md:text-2xl tracking-tight text-white">Your Flower Wilted!</h2>
            <p className="text-slate-400 text-xs mt-1.5">You fought courageously but are out of petal shield energy.</p>

            <div className="grid grid-cols-3 gap-4 w-full my-6 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Matches Score</span>
                <span className="text-indigo-400 font-mono font-bold text-lg mt-1">{defeatStats.score.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Pollen Collected</span>
                <span className="text-amber-400 font-mono font-bold text-lg mt-1">{defeatStats.pollenEaten}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Max Level Reached</span>
                <span className="text-emerald-400 font-bold text-lg mt-1">Lv. {defeatStats.level}</span>
              </div>
            </div>

            {/* Rewards claimed */}
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-amber-500/10 px-4 py-2 rounded-xl mb-6 border border-amber-400/25">
              <span>Earned +{Math.floor(defeatStats.score / 20)} Coins for shop currency!</span>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setGameState('menu')}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-501 hover:bg-indigo-500 text-white font-extrabold text-xs tracking-wider rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all focus:outline-none cursor-pointer"
              >
                RETURN TO LOBBY
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Humble craft credits footer */}
      <footer className="py-4 border-t border-slate-800/30 text-[10px] text-slate-500 text-center">
        <p>Flowercool.io 2 &copy; 2026 apocalipto-gaming community showcase applet.</p>
      </footer>

    </div>
  );
}
