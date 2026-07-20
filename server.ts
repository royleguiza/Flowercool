import express from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { spawnPollenList, constrainToWorld, updatePlayerPhysics, getOrbitingPetalPos, resolveElasticCollision, WORLD_WIDTH, WORLD_HEIGHT, PETAL_SPEED } from './src/game/Physics';
import { GamePlayer, GamePetal, GamePollen, GameBoss } from './src/types';

// Optional server-side Firebase configuration to back leaderboards / posts if needed
// We can also have an inline memory database that acts as a local fallback and syncs to Firestore securely.

const PORT = 3000;

interface ClientSession {
  ws: WebSocket;
  playerId: string;
}

// In-memory gamestate
let players: Record<string, GamePlayer> = {};
let petals: GamePetal[] = [];
let pollens: GamePollen[] = spawnPollenList(200);
let boss: GameBoss | null = {
  id: 'giant-weed-boss',
  name: 'The Mega-Weed Alpha',
  x: WORLD_WIDTH / 2,
  y: WORLD_HEIGHT / 2,
  vx: 0,
  vy: 0,
  radius: 120,
  health: 1500,
  maxHealth: 1500,
  state: 'idle',
  targetPlayerId: null,
};

// In-memory posts & comments
let communityPosts = [
  {
    postId: 'post-init-1',
    authorId: 'dev-team',
    authorName: 'Flowercool Admin',
    authorAvatar: '👑',
    content: 'Welcome to Flowercool.io 2! Dive into our brand new cooperative boss maps and customization accessory storefront! 🌸✨',
    type: 'post',
    likesCount: 34,
    createdAt: new Date().toISOString()
  },
  {
    postId: 'post-init-2',
    authorId: 'creator-apocalipto',
    authorName: 'apocalipto-gaming',
    authorAvatar: '🎥',
    content: 'Streaming Flowercool.io 2 LIVE right now on my YouTube Channel! Checking out the golden skin and trying to beat the legendary Alpha Weed boss. Help me out in coop mode! 🚀🌸',
    type: 'stream',
    likesCount: 156,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

// Active sessions mapping
const sessions: Record<string, ClientSession> = {};
let tickCount = 0;

// Accessoy list
const accessorySkins = [
  { id: 'rose', name: 'Rose Red', cost: 0, color: '#ef4444' },
  { id: 'sunflower', name: 'Sunflower Yellow', cost: 100, color: '#fbbf24' },
  { id: 'orchid', name: 'Purple Orchid', cost: 250, color: '#a855f7' },
  { id: 'clover', name: 'Emerald Clover', cost: 400, color: '#10b981' },
  { id: 'sakura', name: 'Pink Sakura', cost: 600, color: '#f472b6' },
  { id: 'royal', name: 'Royal Sapphire', cost: 1000, color: '#3b82f6' },
];

async function startServer() {
  const app = express();
  app.use(express.json());

  const httpServer = createHttpServer(app);
  const wss = new WebSocketServer({ noServer: true });

  // Handle HTTP API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ws_connections: Object.keys(sessions).length });
  });

  app.get('/api/posts', (req, res) => {
    res.json(communityPosts);
  });

  app.post('/api/posts', (req, res) => {
    const { authorId, authorName, authorAvatar, content, type } = req.body;
    if (!content || !authorName) {
      res.status(400).json({ error: 'Missing content or username details.' });
      return;
    }
    const newPost = {
      postId: `post-${Math.random().toString(36).substr(2, 9)}`,
      authorId: authorId || 'anonymous',
      authorName,
      authorAvatar: authorAvatar || '🌸',
      content,
      type: type || 'post',
      likesCount: 0,
      createdAt: new Date().toISOString()
    };
    communityPosts.unshift(newPost);
    res.json(newPost);
  });

  app.post('/api/posts/:postId/like', (req, res) => {
    const { postId } = req.params;
    const post = communityPosts.find(p => p.postId === postId);
    if (post) {
      post.likesCount += 1;
      res.json({ success: true, likesCount: post.likesCount });
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  });

  // Handle WS upgrade on HTTP Server instance
  httpServer.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    const playerId = `player-${Math.random().toString(36).substr(2, 9)}`;
    sessions[playerId] = { ws, playerId };

    ws.on('message', (message: string) => {
      try {
        const event = JSON.parse(message);
        
        if (event.type === 'join') {
          const skin = accessorySkins.find(s => s.id === event.skin) || accessorySkins[0];
          
          players[playerId] = {
            id: playerId,
            username: event.username || `Flower-${Math.floor(Math.random() * 9000 + 1000)}`,
            x: Math.random() * (WORLD_WIDTH - 200) + 100,
            y: Math.random() * (WORLD_HEIGHT - 200) + 100,
            vx: 0,
            vy: 0,
            radius: 40,
            level: 1,
            xp: 0,
            score: 0,
            coins: 0,
            health: 100,
            maxHealth: 100,
            skinColor: skin.color,
            equippedAccessory: event.accessory || 'none',
            activePetalsCount: 4,
            maxPetals: 4,
            angle: 0
          };

          ws.send(JSON.stringify({
            type: 'init',
            id: playerId,
            worldWidth: WORLD_WIDTH,
            worldHeight: WORLD_HEIGHT
          }));
        }

        if (event.type === 'input') {
          const player = players[playerId];
          if (player) {
            updatePlayerPhysics(player, event.angle, event.isMoving);
          }
        }

        if (event.type === 'shoot') {
          const player = players[playerId];
          if (player && player.activePetalsCount > 0) {
            player.activePetalsCount--;
            // Fire petal projectile outward from flower boundary
            const offsetDist = player.radius + 20;
            const px = player.x + Math.cos(event.angle) * offsetDist;
            const py = player.y + Math.sin(event.angle) * offsetDist;
            
            petals.push({
              id: `petal-${Math.random().toString(36).substr(2, 9)}`,
              ownerId: playerId,
              x: px,
              y: py,
              vx: Math.cos(event.angle) * PETAL_SPEED,
              vy: Math.sin(event.angle) * PETAL_SPEED,
              radius: 12,
              angle: event.angle,
              damage: 15 + player.level * 2,
              type: 'projectile'
            });

            // Slight recoil in opposite direction
            player.vx -= Math.cos(event.angle) * 1.5;
            player.vy -= Math.sin(event.angle) * 1.5;
          }
        }

        if (event.type === 'suicide') {
          handlePlayerDefeat(playerId, 'Self-defeat');
        }

        if (event.type === 'chat') {
          // Broadcast chat messages to all connected players
          const sender = players[playerId];
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'chat_message',
                senderName: sender ? sender.username : 'Unknown Flower',
                text: event.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }));
            }
          });
        }
      } catch (err) {
        console.error('Failed to parse WebSocket incoming event:', err);
      }
    });

    ws.on('close', () => {
      delete players[playerId];
      delete sessions[playerId];
    });
  });

  // Main 30Hz Game Loop (Physics and state broadcast)
  setInterval(() => {
    tickCount++;

    // 1. Resolve flower-to-flower bounce collisions
    const playerIds = Object.keys(players);
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        resolveElasticCollision(players[playerIds[i]], players[playerIds[j]]);
      }
    }

    // 2. Replenish petals naturally for players (every 5 seconds)
    if (tickCount % 150 === 0) {
      Object.values(players).forEach(p => {
        if (p.activePetalsCount < p.maxPetals) {
          p.activePetalsCount++;
        }
      });
    }

    // 3. Update Boss (Defeat the Weed Alpha)
    if (boss) {
      // Find nearest player to target
      let nearestDist = Infinity;
      let targetPlayer: GamePlayer | null = null;
      
      Object.values(players).forEach(p => {
        const dist = Math.sqrt((p.x - boss!.x) ** 2 + (p.y - boss!.y) ** 2);
        if (dist < nearestDist) {
          nearestDist = dist;
          targetPlayer = p;
        }
      });

      if (targetPlayer && nearestDist < 800) {
        boss.targetPlayerId = (targetPlayer as GamePlayer).id;
        boss.state = nearestDist < 300 ? 'rage' : 'attack';
        
        // Dynamic chase physics
        const dx = (targetPlayer as GamePlayer).x - boss.x;
        const dy = (targetPlayer as GamePlayer).y - boss.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const speed = boss.state === 'rage' ? 3.0 : 1.5;
        boss.vx = (dx / dist) * speed;
        boss.vy = (dy / dist) * speed;
      } else {
        boss.targetPlayerId = null;
        boss.state = 'idle';
        // Roaming drift physics
        if (tickCount % 120 === 0) {
          const roamAngle = Math.random() * Math.PI * 2;
          boss.vx = Math.cos(roamAngle) * 0.8;
          boss.vy = Math.sin(roamAngle) * 0.8;
        }
      }

      boss.x += boss.vx;
      boss.y += boss.vy;

      // Restrict boss to center map radius
      const boundDist = Math.sqrt((boss.x - WORLD_WIDTH/2)**2 + (boss.y - WORLD_HEIGHT/2)**2);
      if (boundDist > 1200) {
        const angle = Math.atan2(boss.y - WORLD_HEIGHT/2, boss.x - WORLD_WIDTH/2);
        boss.x = WORLD_WIDTH/2 + Math.cos(angle) * 1200;
        boss.y = WORLD_HEIGHT/2 + Math.sin(angle) * 1200;
      }

      // Boss damaging surrounding players
      Object.values(players).forEach(p => {
        const dist = Math.sqrt((p.x - boss!.x) ** 2 + (p.y - boss!.y) ** 2);
        if (dist < p.radius + boss!.radius) {
          p.health -= 0.8; // Contact damage over time
          // Apply outward knockback push
          const angle = Math.atan2(p.y - boss!.y, p.x - boss!.x);
          p.vx += Math.cos(angle) * 1.5;
          p.vy += Math.sin(angle) * 1.5;

          if (p.health <= 0) {
            handlePlayerDefeat(p.id, 'The Weed Alpha');
          }
        }
      });
    }

    // 4. Update Petal Projectiles
    petals = petals.filter(petal => {
      // Advance coordinates
      petal.x += petal.vx;
      petal.y += petal.vy;

      // Disappear if out of boundaries
      if (petal.x < 0 || petal.x > WORLD_WIDTH || petal.y < 0 || petal.y > WORLD_HEIGHT) {
        return false;
      }

      // Check hits against other flowers
      let hit = false;
      for (const pId of Object.keys(players)) {
        if (pId === petal.ownerId) continue; // Friendly protection
        
        const player = players[pId];
        const dist = Math.sqrt((petal.x - player.x) ** 2 + (petal.y - player.y) ** 2);
        
        if (dist < player.radius + petal.radius) {
          player.health -= petal.damage;
          player.vx += (petal.vx / PETAL_SPEED) * 5; // Knockback momentum transfer
          player.vy += (petal.vy / PETAL_SPEED) * 5;
          hit = true;
          
          if (player.health <= 0) {
            const attacker = players[petal.ownerId];
            if (attacker) {
              attacker.score += Math.floor(player.score * 0.3) + 200;
              attacker.xp += 100;
              attacker.coins += 50;
              checkLevelUp(attacker);
            }
            handlePlayerDefeat(player.id, attacker ? attacker.username : 'Unknown Flower');
          }
          break;
        }
      }

      if (hit) return false;

      // Check hit against Weed Boss
      if (boss) {
        const distToBoss = Math.sqrt((petal.x - boss.x) ** 2 + (petal.y - boss.y) ** 2);
        if (distToBoss < boss.radius + petal.radius) {
          boss.health -= petal.damage;
          
          // Recompense shooter for damage
          const shooter = players[petal.ownerId];
          if (shooter) {
            shooter.score += 25;
            shooter.xp += 10;
            shooter.coins += 2;
            checkLevelUp(shooter);
          }

          if (boss.health <= 0) {
            // Reward all active room players for defeating Boss!
            Object.values(players).forEach(p => {
              p.score += 1500;
              p.xp += 600;
              p.coins += 150;
              checkLevelUp(p);
            });
            
            // Respawn stronger Weed Boss after 15 seconds
            boss = null;
            setTimeout(() => {
              boss = {
                id: 'giant-weed-boss',
                name: 'The Mega-Weed Alpha',
                x: WORLD_WIDTH / 2,
                y: WORLD_HEIGHT / 2,
                vx: 0,
                vy: 0,
                radius: 120,
                health: 2000,
                maxHealth: 2000,
                state: 'idle',
                targetPlayerId: null,
              };
            }, 15000);
          }
          return false;
        }
      }

      return true;
    });

    // 5. Update Food/Pollen eating mechanics
    Object.values(players).forEach(player => {
      pollens = pollens.filter(pollen => {
        const dist = Math.sqrt((pollen.x - player.x) ** 2 + (pollen.y - player.y) ** 2);
        if (dist < player.radius) {
          // Consume pollen!
          player.xp += pollen.value;
          player.score += pollen.value * 10;
          checkLevelUp(player);
          return false; // Remove pollen
        }
        return true;
      });
    });

    // Replenish pollen continuously if numbers diminish
    if (pollens.length < 150) {
      pollens = pollens.concat(spawnPollenList(30));
    }

    // 6. Broadcast updated state to all connected game sessions
    const statePayload = JSON.stringify({
      type: 'state',
      players,
      petals,
      pollens,
      boss
    });

    Object.values(sessions).forEach(sess => {
      if (sess.ws.readyState === WebSocket.OPEN) {
        sess.ws.send(statePayload);
      }
    });
  }, 33); // 30 FPS update interval

  function checkLevelUp(player: GamePlayer) {
    const requiredXp = player.level * 100 + 50;
    if (player.xp >= requiredXp) {
      player.xp -= requiredXp;
      player.level++;
      player.maxHealth += 10;
      player.health = player.maxHealth;
      player.radius = 40 + player.level * 1.5; // Flower grows visually in scale
      player.maxPetals = Math.min(12, 4 + Math.floor(player.level / 2));
      player.score += 500;
    }
  }

  function handlePlayerDefeat(id: string, cause: string) {
    const sess = sessions[id];
    if (sess && sess.ws.readyState === WebSocket.OPEN) {
      sess.ws.send(JSON.stringify({
        type: 'defeat',
        cause,
        stats: {
          score: players[id]?.score || 0,
          pollenEaten: Math.floor((players[id]?.score || 0) / 10),
          level: players[id]?.level || 1,
        }
      }));
    }
    delete players[id];
  }

  // Vite development server / static assets configuration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[FlowercoolServer] Listening on http://localhost:${PORT}`);
  });
}

startServer();
