/**
 * Flowercool.io 2 - Types Definition
 */

export interface UserProfile {
  userId: string;
  username: string;
  level: number;
  xp: number;
  highScore: number;
  coins: number;
  equippedSkin: string;
  equippedAccessory: string;
  unlockedSkins: string[];
  unlockedAccessories: string[];
}

export interface PlayerStats {
  score: number;
  pollenEaten: number;
  kills: number;
  bossDamage: number;
  duration: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  type: 'play' | 'eat' | 'kill' | 'boss';
}

export interface Accessory {
  id: string;
  name: string;
  category: 'skins' | 'accessories';
  cost: number;
  color?: string; // For skins
  svgIcon?: string; // For accessories
  description: string;
}

export interface CommunityPost {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  type: 'stream' | 'post' | 'comment';
  likesCount: number;
  createdAt: string; // ISO String
}

export interface VoiceMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSimulated?: boolean;
}

// Game engine interface
export interface Vector2D {
  x: number;
  y: number;
}

export interface GamePlayer {
  id: string;
  username: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  level: number;
  xp: number;
  score: number;
  coins: number;
  health: number;
  maxHealth: number;
  skinColor: string;
  equippedAccessory: string;
  activePetalsCount: number;
  maxPetals: number;
  angle: number; // facing direction
}

export interface GamePetal {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  damage: number;
  type: 'orbiting' | 'projectile';
}

export interface GamePollen {
  id: string;
  x: number;
  y: number;
  value: number; // XP worth
  color: string;
  radius: number;
}

export interface GameBoss {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  state: 'idle' | 'rage' | 'attack';
  targetPlayerId: string | null;
}

export interface GameState {
  players: Record<string, GamePlayer>;
  petals: GamePetal[];
  pollens: GamePollen[];
  boss: GameBoss | null;
  worldWidth: number;
  worldHeight: number;
}
