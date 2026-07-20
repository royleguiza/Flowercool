import React, { useRef, useEffect, useState } from 'react';
import { GamePlayer, GamePetal, GamePollen, GameBoss } from '../types';
import { getOrbitingPetalPos, WORLD_WIDTH, WORLD_HEIGHT } from './Physics';
import { Flower, LogIn, Heart, Shield, Trophy, Target, Award, Play } from 'lucide-react';

interface GameCanvasProps {
  socket: WebSocket | null;
  playerId: string;
  players: Record<string, GamePlayer>;
  petals: GamePetal[];
  pollens: GamePollen[];
  boss: GameBoss | null;
  onDefeat: (stats: { score: number; pollenEaten: number; level: number }) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  socket,
  playerId,
  players,
  petals,
  pollens,
  boss,
  onDefeat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [fps, setFps] = useState(59);
  const [mspt, setMspt] = useState(16.8);
  const [showHud, setShowHud] = useState(true);
  const [playTime, setPlayTime] = useState('0 Horas 2 Min');

  // Simple interval to simulate fluctuating realistic network telemetry to look genuine!
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(Math.random() * 5) + 55);
      setMspt(parseFloat((Math.random() * 4 + 15).toFixed(1)));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Simple playtime counter
  useEffect(() => {
    let minutes = 2;
    let hours = 0;
    const interval = setInterval(() => {
      minutes++;
      if (minutes >= 60) {
        minutes = 0;
        hours++;
      }
      setPlayTime(`${hours} Horas ${minutes} Min`);
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Track continuous player input reporting to server
  const inputIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keysPressed = useRef<Record<string, boolean>>({});
  const tickCountRef = useRef(0);

  // Resize canvas dynamic observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 200),
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.toLowerCase() === 'spacebar') {
        e.preventDefault();
        shootPetal();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [socket, playerId, mousePos]);

  // Click to shoot petal
  const shootPetal = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !players[playerId]) return;
    
    // Calculate shooting angle based on mouse orientation
    const localPlayer = players[playerId];
    const screenCenterX = dimensions.width / 2;
    const screenCenterY = dimensions.height / 2;
    const angle = Math.atan2(mousePos.y - screenCenterY, mousePos.x - screenCenterX);
    
    socket.send(JSON.stringify({
      type: 'shoot',
      angle,
    }));
  };

  // Continuous loop to transmit player inputs to server (at 30Hz)
  useEffect(() => {
    inputIntervalRef.current = setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN || !players[playerId]) return;
      
      const localPlayer = players[playerId];
      const screenCenterX = dimensions.width / 2;
      const screenCenterY = dimensions.height / 2;
      
      // Target direction angle relative to screen center
      const angle = Math.atan2(mousePos.y - screenCenterY, mousePos.x - screenCenterX);
      
      // Determine if moving (W, A, S, D, Arrow keys, or Mouse Dragging)
      let isMoving = keysPressed.current['w'] || keysPressed.current['a'] || 
                       keysPressed.current['s'] || keysPressed.current['d'] ||
                       keysPressed.current['arrowup'] || keysPressed.current['arrowdown'] ||
                       keysPressed.current['arrowleft'] || keysPressed.current['arrowright'];

      // Default: If no WASD keys are pressed, we can also drift towards the cursor if desired
      // Let's implement active cursor-following movement
      if (!isMoving) {
        const dx = mousePos.x - screenCenterX;
        const dy = mousePos.y - screenCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 30) {
          isMoving = true;
        }
      }

      socket.send(JSON.stringify({
        type: 'input',
        angle,
        isMoving,
      }));
    }, 33);

    return () => {
      if (inputIntervalRef.current) clearInterval(inputIntervalRef.current);
    };
  }, [socket, playerId, mousePos, dimensions]);

  // Canvas Core Renders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    tickCountRef.current++;
    const ticks = tickCountRef.current;

    // Local player details for camera centering
    const localPlayer = players[playerId] || {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      radius: 40,
    };

    // Camera transforms relative to player center
    const camX = localPlayer.x - dimensions.width / 2;
    const camY = localPlayer.y - dimensions.height / 2;

    // Clear Canvas with sleek green garden grid aesthetic
    ctx.fillStyle = '#7ee143'; // Bright green grass background
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Render Grid Lines for fluid speed feedback
    ctx.strokeStyle = '#6bce2e'; // Darker grass green grid line
    ctx.lineWidth = 1.5;
    const gridSize = 60;
    
    const startX = Math.floor(camX / gridSize) * gridSize;
    const startY = Math.floor(camY / gridSize) * gridSize;
    
    for (let x = startX; x < startX + dimensions.width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x - camX, 0);
      ctx.lineTo(x - camX, dimensions.height);
      ctx.stroke();
    }
    
    for (let y = startY; y < startY + dimensions.height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y - camY);
      ctx.lineTo(dimensions.width, y - camY);
      ctx.stroke();
    }

    // Draw Map Borders (Black dashed lines like in screenshot)
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.rect(-camX, -camY, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.stroke();
    ctx.restore();

    // Render pollen grain foods (Glow effect & minimalist circles)
    pollens.forEach((pollen) => {
      // Basic camera clip boundaries checking
      const px = pollen.x - camX;
      const py = pollen.y - camY;
      if (px < -30 || px > dimensions.width + 30 || py < -30 || py > dimensions.height + 30) return;

      ctx.save();
      ctx.shadowBlur = pIdToNumber(pollen.id) % 2 === 0 ? 12 : 4;
      ctx.shadowColor = pollen.color;
      ctx.fillStyle = pollen.color;
      ctx.beginPath();
      ctx.arc(px, py, pollen.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render the Giant Weed Boss (Coop Target)
    if (boss) {
      const bx = boss.x - camX;
      const by = boss.y - camY;
      ctx.save();
      
      // Rage neon pulsation
      const glowRange = boss.state === 'rage' ? 30 : 15;
      const glowRadius = boss.radius + Math.sin(ticks * 0.1) * glowRange;

      // Outer spikey glow
      const spikeGradient = ctx.createRadialGradient(bx, by, boss.radius - 20, bx, by, glowRadius);
      spikeGradient.addColorStop(0, '#581c87'); // Rich purple
      spikeGradient.addColorStop(0.5, '#7e22ce'); // Bright purple
      spikeGradient.addColorStop(1, 'rgba(126, 34, 206, 0)');
      
      ctx.fillStyle = spikeGradient;
      ctx.beginPath();
      ctx.arc(bx, by, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sharp crown spines
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      const spikesCount = 14;
      ctx.beginPath();
      for (let s = 0; s < spikesCount; s++) {
        const angle = (s / spikesCount) * Math.PI * 2 + (ticks * 0.015);
        const innerX = bx + Math.cos(angle) * (boss.radius - 10);
        const innerY = by + Math.sin(angle) * (boss.radius - 10);
        const outerX = bx + Math.cos(angle) * (boss.radius + 15 + Math.sin(ticks * 0.08 + s) * 10);
        const outerY = by + Math.sin(angle) * (boss.radius + 15 + Math.sin(ticks * 0.08 + s) * 10);
        ctx.moveTo(innerX, innerY);
        ctx.lineTo(outerX, outerY);
      }
      ctx.stroke();

      // Inner Weed Core Cell
      ctx.fillStyle = '#2e1065';
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(bx, by, boss.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Angered expression
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      // Left eye
      ctx.arc(bx - 30, by - 20, 10, 0, Math.PI, true);
      // Right eye
      ctx.arc(bx + 30, by - 20, 10, 0, Math.PI, true);
      ctx.fill();

      // Threatening grin line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(bx, by + 20, 25, 0, Math.PI, true);
      ctx.stroke();

      // Text name and life status bar overlay
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(boss.name, bx, by + boss.radius + 30);

      // Health bar bg
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx - 90, by + boss.radius + 40, 180, 12);
      // Active HP
      const hpPercentage = Math.max(0, boss.health / boss.maxHealth);
      ctx.fillStyle = boss.state === 'rage' ? '#ef4444' : '#a855f7';
      ctx.fillRect(bx - 90, by + boss.radius + 40, 180 * hpPercentage, 12);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx - 90, by + boss.radius + 40, 180, 12);
      
      ctx.restore();
    }

    // Render other players and local player
    (Object.values(players) as GamePlayer[]).forEach((p) => {
      const px = p.x - camX;
      const py = p.y - camY;
      
      if (px < -150 || px > dimensions.width + 150 || py < -150 || py > dimensions.height + 150) return;

      const isCurrentPlayer = p.id === playerId;

      // Scent/Pollen motion wind trails (fluid procedural curves at rear)
      const movementSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (movementSpeed > 1) {
        ctx.save();
        ctx.strokeStyle = p.skinColor;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const trailAngle = Math.atan2(p.vy, p.vx) + Math.PI;
        ctx.moveTo(px + Math.cos(trailAngle) * p.radius, py + Math.sin(trailAngle) * p.radius);
        ctx.bezierCurveTo(
          px + Math.cos(trailAngle + 0.3) * (p.radius + 40),
          py + Math.sin(trailAngle + 0.3) * (p.radius + 40),
          px + Math.cos(trailAngle - 0.3) * (p.radius + 60),
          py + Math.sin(trailAngle - 0.3) * (p.radius + 60),
          px + Math.cos(trailAngle) * (p.radius + 80),
          py + Math.sin(trailAngle) * (p.radius + 80)
        );
        ctx.stroke();
        ctx.restore();
      }

      // 1. Draw Orbiting Petals (Shield)
      for (let index = 0; index < p.activePetalsCount; index++) {
        const orbitPos = getOrbitingPetalPos(p.x, p.y, p.radius, index, p.maxPetals, ticks);
        const opx = orbitPos.x - camX;
        const opy = orbitPos.y - camY;

        ctx.save();
        // Dynamic pastel flower core
        ctx.fillStyle = p.skinColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        
        // Petal shape: teardrop/oval oriented towards center
        const petalAngle = Math.atan2(opy - py, opx - px);
        ctx.ellipse(opx, opy, 20, p.radius * 0.24, petalAngle, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 2. Draw Flower Core Cell
      ctx.save();
      // Outer colored body
      ctx.fillStyle = p.skinColor;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Yellow inner face circle (just like the cute face in the image!)
      const faceRadius = p.radius * 0.72;
      ctx.fillStyle = '#ffcc00'; // Cute bright yellow smiley face background
      ctx.beginPath();
      ctx.arc(px, py, faceRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw cute cartoon facial features based on username/id
      const hashVal = pIdToNumber(p.id);
      ctx.fillStyle = '#000000';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;

      if (hashVal % 3 === 0) {
        // Smiley Face
        // Left Eye
        ctx.beginPath();
        ctx.arc(px - faceRadius * 0.35, py - faceRadius * 0.1, faceRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Right Eye
        ctx.beginPath();
        ctx.arc(px + faceRadius * 0.35, py - faceRadius * 0.1, faceRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Smiley mouth
        ctx.beginPath();
        ctx.arc(px, py + faceRadius * 0.1, faceRadius * 0.35, 0, Math.PI, false);
        ctx.stroke();
      } else if (hashVal % 3 === 1) {
        // Cute Sleeping/Winking face
        // Left eye closed (arc)
        ctx.beginPath();
        ctx.arc(px - faceRadius * 0.35, py - faceRadius * 0.05, faceRadius * 0.15, Math.PI, 0, false);
        ctx.stroke();
        // Right eye closed (arc)
        ctx.beginPath();
        ctx.arc(px + faceRadius * 0.35, py - faceRadius * 0.05, faceRadius * 0.15, Math.PI, 0, false);
        ctx.stroke();
        // Little "o" singing mouth
        ctx.beginPath();
        ctx.arc(px, py + faceRadius * 0.2, faceRadius * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Snowflake/Star design face
        // Left eye star / diamond
        ctx.beginPath();
        ctx.moveTo(px - faceRadius * 0.35, py - faceRadius * 0.2);
        ctx.lineTo(px - faceRadius * 0.25, py - faceRadius * 0.1);
        ctx.lineTo(px - faceRadius * 0.35, py);
        ctx.lineTo(px - faceRadius * 0.45, py - faceRadius * 0.1);
        ctx.closePath();
        ctx.fill();
        // Right eye star / diamond
        ctx.beginPath();
        ctx.moveTo(px + faceRadius * 0.35, py - faceRadius * 0.2);
        ctx.lineTo(px + faceRadius * 0.45, py - faceRadius * 0.1);
        ctx.lineTo(px + faceRadius * 0.35, py);
        ctx.lineTo(px + faceRadius * 0.25, py - faceRadius * 0.1);
        ctx.closePath();
        ctx.fill();
        // Cute tongue or open smiling mouth
        ctx.beginPath();
        ctx.arc(px, py + faceRadius * 0.1, faceRadius * 0.25, 0, Math.PI, false);
        ctx.stroke();
      }

      ctx.restore();

      // Render Customizable equipped accessory (Crown, Sunglasses, Leaf Cape, Beats headphones)
      if (p.equippedAccessory && p.equippedAccessory !== 'none') {
        ctx.save();
        if (p.equippedAccessory === 'crown') {
          // Majestic sparkling gold crown sitting on topmost portion
          ctx.fillStyle = '#eab308';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          const topY = py - p.radius * 0.9;
          ctx.moveTo(px - 18, py - p.radius * 0.5);
          ctx.lineTo(px - 22, topY - 10); // Left spire
          ctx.lineTo(px - 8, py - p.radius * 0.7);
          ctx.lineTo(px, topY - 24); // Center spire
          ctx.lineTo(px + 8, py - p.radius * 0.7);
          ctx.lineTo(px + 22, topY - 10); // Right spire
          ctx.lineTo(px + 18, py - p.radius * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Crown jewel spots
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(px, topY - 24, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.equippedAccessory === 'glasses') {
          // Awesome cool designer sunglasses
          ctx.fillStyle = '#000000';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          
          // Left lens
          ctx.beginPath();
          ctx.rect(px - 22, py - 10, 16, 12);
          ctx.fill();
          ctx.stroke();

          // Right lens
          ctx.beginPath();
          ctx.rect(px + 6, py - 10, 16, 12);
          ctx.fill();
          ctx.stroke();

          // Center bridge connection
          ctx.beginPath();
          ctx.moveTo(px - 6, py - 4);
          ctx.lineTo(px + 6, py - 4);
          ctx.stroke();
        } else if (p.equippedAccessory === 'headphones') {
          // Neon violet retro beats headphones
          ctx.strokeStyle = '#d946ef'; // Magenta
          ctx.lineWidth = 6;
          // Arch head band
          ctx.beginPath();
          ctx.arc(px, py, p.radius + 2, Math.PI, 0);
          ctx.stroke();

          // Left pad cup
          ctx.fillStyle = '#a21caf';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(px - p.radius - 3, py, 6, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Right pad cup
          ctx.beginPath();
          ctx.ellipse(px + p.radius + 3, py, 6, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (p.equippedAccessory === 'leaf_cape') {
          // Elegant woodland green leaf cape blowing behind flower movement relative to angle
          const capeAngle = p.angle + Math.PI; // trailing behind
          ctx.fillStyle = '#22c55e';
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(
            px + Math.cos(capeAngle) * (p.radius + 15),
            py + Math.sin(capeAngle) * (p.radius + 15),
            20,
            10,
            capeAngle,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Health & Experience Indicators Above Head
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Inter", sans-serif';
      ctx.textAlign = 'center';
      
      // User name string
      const prefix = isCurrentPlayer ? '🌸 ' : '';
      ctx.fillText(`${prefix}${p.username} [Lv.${p.level}]`, px, py - p.radius - 20);

      // Simple HUD status bar backgrounds
      ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.fillRect(px - 30, py - p.radius - 12, 60, 5);

      // HP bar fills
      const hpRatio = Math.max(0, p.health / p.maxHealth);
      ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(px - 30, py - p.radius - 12, 60 * hpRatio, 5);
    });

    // Render active projectile petals zooming forward!
    petals.forEach((petal) => {
      if (petal.type !== 'projectile') return;
      const ppx = petal.x - camX;
      const ppy = petal.y - camY;
      
      if (ppx < -30 || ppx > dimensions.width + 30 || ppy < -30 || ppy > dimensions.height + 30) return;

      // Draw customized spinning razor projectile petal
      ctx.save();
      const pOwner = players[petal.ownerId];
      ctx.fillStyle = pOwner ? pOwner.skinColor : '#ff4757';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      
      // Add spinning rotation depending on ticks
      const spinAngle = petal.angle + ticks * 0.15;
      ctx.beginPath();
      ctx.shadowBlur = 10;
      ctx.shadowColor = pOwner ? pOwner.skinColor : '#ff4757';
      ctx.ellipse(ppx, ppy, petal.radius * 1.5, petal.radius * 0.7, spinAngle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Request animation frame for next visual loop refresh
    const animationFrameId = requestAnimationFrame(() => {});
    return () => cancelAnimationFrame(animationFrameId);
  }, [players, petals, pollens, boss, dimensions, mousePos, playerId]);

  // Handle cursor positioning
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Helper routine to convert strings into static seeds/hash numbers
  const pIdToNumber = (id: string): number => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
       hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const activeUserStats = players[playerId] || null;

  const handleSuicide = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'suicide' }));
    }
  };

  const handleReturnToMenu = () => {
    if (socket) {
      socket.close();
    }
  };

  return (
    <div id="canvas-game-container" ref={containerRef} className="w-full h-full relative cursor-crosshair overflow-hidden rounded-2xl border-4 border-black bg-[#7ee143] select-none shadow-2xl min-h-[450px]">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onClick={shootPetal}
        className="w-full h-full block"
      />
      
      {showHud && activeUserStats && (
        <>
          {/* Top-Left Telemetry badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/75 px-3 py-1 rounded-md text-[10px] font-mono text-slate-300 border border-slate-700/45">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span> ONLINE</span>
              <span>FPS: {fps}</span>
              <span>MSPT: {mspt}ms</span>
            </div>

            {/* SUPERVIVENCIA ACTIVA Badge */}
            <div className="bg-[#1b4332]/90 border-2 border-black rounded-lg p-2.5 w-44 text-left shadow-lg">
              <div className="text-[10px] text-[#40c057] font-black tracking-wider uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#40c057] inline-block"></span>
                Supervivencia Activa
              </div>
              <div className="text-white font-extrabold text-[11px] mt-1">
                TIEMPO: {playTime}
              </div>
              <div className="text-[#a6e22e] font-bold text-[9px] mt-0.5 flex items-center gap-1">
                <span>+5 Nvl/Hr</span>
                <span className="text-amber-400">⚡</span>
              </div>
            </div>
          </div>

          {/* Top-Center EVOLUCIÓN Progress Bar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 w-full max-w-[320px] md:max-w-[480px] pointer-events-none select-none px-4">
            <div className="bg-white border-4 border-black rounded-2xl p-1.5 shadow-xl flex items-center gap-3 relative overflow-visible">
              
              {/* Left Circular Level Badge */}
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-black text-xs border-2 border-white flex-shrink-0 shadow-md">
                {String(activeUserStats.level).padStart(5, '0')}
              </div>

              {/* Progress and Label block */}
              <div className="flex-1 flex flex-col text-left">
                <div className="flex justify-between items-center text-[10px] font-black text-black uppercase tracking-wide px-0.5">
                  <span>Evolución</span>
                  <span>{activeUserStats.score} / {activeUserStats.level * 1000 + 500} pts</span>
                </div>
                {/* Visual Bar container */}
                <div className="w-full bg-slate-200 border-2 border-black rounded-full h-4 overflow-hidden mt-1">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (activeUserStats.xp / (activeUserStats.level * 100 + 50)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-Left Controls environment box */}
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none select-none flex flex-col gap-2">
            <div className="bg-white border-3 border-black rounded-xl p-2.5 w-36 shadow-lg text-left">
              <div className="text-[10px] text-slate-800 font-extrabold uppercase tracking-wide flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-md bg-[#82c91e] border border-black inline-block"></span>
                Escenario Selva
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-700">WASD</span>
                <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded border border-slate-700">RATÓN</span>
              </div>
            </div>

            {/* ESTADO: DEFENSA badge */}
            <div className="bg-[#101113] border-3 border-black rounded-lg px-3 py-1.5 w-32 shadow-md text-left">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block leading-none">Estado</span>
              <span className="text-[#37b24d] font-black text-xs tracking-wider uppercase block mt-0.5">
                {activeUserStats.activePetalsCount > 1 ? 'Defensa' : 'Ataque'}
              </span>
            </div>
          </div>

          {/* Right RANKING Leaderboard & Action buttons */}
          <div className="absolute top-3 right-3 z-10 w-44 flex flex-col gap-2 pointer-events-auto select-none">
            
            {/* Leaderboard panel */}
            <div className="bg-white border-4 border-black rounded-2xl p-2.5 shadow-xl">
              <div className="flex items-center gap-1.5 border-b-2 border-slate-200 pb-1 mb-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-[10px] font-black text-black uppercase tracking-wider">Ranking</span>
              </div>

              {/* Leaderboard List */}
              <div className="flex flex-col gap-1 text-left">
                {/* Rank 1 (Active highest or mock high score) */}
                <div className="bg-amber-400 border border-black rounded-lg px-1.5 py-0.5 flex justify-between items-center text-[9px] font-black text-black shadow-sm">
                  <span className="truncate">1. {activeUserStats.username}</span>
                  <span className="text-[7px] uppercase font-bold">Lv.{activeUserStats.level}</span>
                </div>
                {/* Other ranks */}
                <div className="border border-slate-100 rounded-lg px-1.5 py-0.5 flex justify-between items-center text-[9px] font-bold text-slate-700">
                  <span className="truncate">2. PétaloVeloz</span>
                  <span className="text-[7px] text-slate-500 font-mono font-bold">Lv.125</span>
                </div>
                <div className="border border-slate-100 rounded-lg px-1.5 py-0.5 flex justify-between items-center text-[9px] font-bold text-slate-700">
                  <span className="truncate">3. SlimFlower</span>
                  <span className="text-[7px] text-slate-500 font-mono font-bold">Lv.106</span>
                </div>
                <div className="border border-slate-100 rounded-lg px-1.5 py-0.5 flex justify-between items-center text-[9px] font-bold text-slate-700">
                  <span className="truncate">4. Orquidea</span>
                  <span className="text-[7px] text-slate-500 font-mono font-bold">Lv.105</span>
                </div>
                <div className="border border-slate-100 rounded-lg px-1.5 py-0.5 flex justify-between items-center text-[9px] font-bold text-slate-700">
                  <span className="truncate">5. Palmera</span>
                  <span className="text-[7px] text-slate-500 font-mono font-bold">Lv.98</span>
                </div>
              </div>
            </div>

            {/* Stacked Interactive Buttons */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={handleSuicide}
                className="w-full bg-[#ff2b6d] hover:bg-[#e01f5a] text-white font-extrabold text-[11px] py-1.5 rounded-xl border-3 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                💀 Morir
              </button>

              <button
                onClick={() => setShowHud(false)}
                className="w-full bg-[#00a884] hover:bg-[#009473] text-white font-extrabold text-[11px] py-1.5 rounded-xl border-3 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                👁️ HUD / Tablas
              </button>

              <button
                onClick={handleReturnToMenu}
                className="w-full bg-white hover:bg-slate-100 text-black font-extrabold text-[11px] py-1.5 rounded-xl border-3 border-black shadow-[2px_2px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                🔄 Menú
              </button>
            </div>
          </div>

          {/* Bottom-Center Weapon Slots / Petal Inventory Bar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 pointer-events-none select-none">
            {/* Slot 1: Pink Card */}
            <div className="bg-[#ff4b83] border-3 border-black rounded-xl p-1 w-11 h-16 shadow-lg flex flex-col justify-between text-white text-left relative overflow-hidden">
              <div className="absolute -right-1 -bottom-1 text-white/10 text-3xl font-extrabold">1</div>
              <span className="text-[7px] uppercase font-black tracking-widest block leading-tight">1</span>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-sm">🌸</span>
              </div>
              <span className="text-[6px] text-center font-black uppercase tracking-wider block bg-black/30 rounded">Pétalo</span>
            </div>

            {/* Slot 2: Orange Card */}
            <div className="bg-[#fd7e14] border-3 border-black rounded-xl p-1 w-11 h-16 shadow-lg flex flex-col justify-between text-white text-left relative overflow-hidden">
              <div className="absolute -right-1 -bottom-1 text-white/10 text-3xl font-extrabold">2</div>
              <span className="text-[7px] uppercase font-black tracking-widest block leading-tight">2</span>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-sm">🌸</span>
              </div>
              <span className="text-[6px] text-center font-black uppercase tracking-wider block bg-black/30 rounded">Pétalo</span>
            </div>

            {/* Slot 3: Blue Card */}
            <div className="bg-[#3b82f6] border-3 border-black rounded-xl p-1 w-11 h-16 shadow-lg flex flex-col justify-between text-white text-left relative overflow-hidden">
              <div className="absolute -right-1 -bottom-1 text-white/10 text-3xl font-extrabold">3</div>
              <span className="text-[7px] uppercase font-black tracking-widest block leading-tight">3</span>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-sm">🌸</span>
              </div>
              <span className="text-[6px] text-center font-black uppercase tracking-wider block bg-black/30 rounded">Pétalo</span>
            </div>

            {/* Slot 4: Green Cactus Card */}
            <div className="bg-[#12b886] border-3 border-black rounded-xl p-1 w-11 h-16 shadow-lg flex flex-col justify-between text-white text-left relative overflow-hidden">
              <div className="absolute -right-1 -bottom-1 text-white/10 text-3xl font-extrabold">4</div>
              <span className="text-[7px] uppercase font-black tracking-widest block leading-tight">4</span>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-sm">🌵</span>
              </div>
              <span className="text-[6px] text-center font-black uppercase tracking-wider block bg-black/30 rounded text-emerald-200">Cactus</span>
            </div>

            {/* Slot 5: Cyan Card */}
            <div className="bg-[#06b6d4] border-3 border-black rounded-xl p-1 w-11 h-16 shadow-lg flex flex-col justify-between text-white text-left relative overflow-hidden">
              <div className="absolute -right-1 -bottom-1 text-white/10 text-3xl font-extrabold">5</div>
              <span className="text-[7px] uppercase font-black tracking-widest block leading-tight">5</span>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-sm">🌸</span>
              </div>
              <span className="text-[6px] text-center font-black uppercase tracking-wider block bg-black/30 rounded">Pétalo</span>
            </div>
          </div>

          {/* Bottom-Right Radar Minimap */}
          <div className="absolute bottom-3 right-3 z-10 bg-[#35651c] border-3 border-black rounded-2xl w-20 h-20 shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:8px_8px]" />
            <div className="absolute top-1 left-1 text-[6px] text-white/60 font-mono font-bold uppercase leading-none">Radar</div>
            
            {/* Dynamic radar blips representing active players */}
            <div className="absolute inset-0 pointer-events-none">
              {(Object.values(players) as GamePlayer[]).map((p) => {
                const normX = (p.x / WORLD_WIDTH) * 80;
                const normY = (p.y / WORLD_HEIGHT) * 80;
                const isLocal = p.id === playerId;
                return (
                  <div 
                    key={p.id}
                    className={`absolute w-1.5 h-1.5 rounded-full border border-black ${isLocal ? 'bg-yellow-400 animate-pulse' : 'bg-[#ff2b6d]'}`}
                    style={{ left: `${Math.min(74, Math.max(4, normX))}px`, top: `${Math.min(74, Math.max(4, normY))}px` }}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Hidden HUD Return button if HUD is turned off */}
      {!showHud && (
        <button
          onClick={() => setShowHud(true)}
          className="absolute top-3 right-3 z-20 bg-black/80 hover:bg-black text-white font-extrabold text-xs px-3 py-1.5 rounded-lg border-2 border-slate-700/80 cursor-pointer"
        >
          👁️ Mostrar HUD
        </button>
      )}
    </div>
  );
};
