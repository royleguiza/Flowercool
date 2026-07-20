import { GamePlayer, GamePetal, GamePollen, GameBoss, Vector2D } from '../types';

export const WORLD_WIDTH = 3000;
export const WORLD_HEIGHT = 3000;
export const FRICTION = 0.96; // Fluid air resistance
export const MAX_SPEED = 8;
export const PETAL_SPEED = 14;

// Calculate distance between two vectors
export function getDistance(p1: Vector2D, p2: Vector2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Keep player inside map boundaries
export function constrainToWorld(pos: Vector2D, radius: number): Vector2D {
  return {
    x: Math.max(radius, Math.min(WORLD_WIDTH - radius, pos.x)),
    y: Math.max(radius, Math.min(WORLD_HEIGHT - radius, pos.y)),
  };
}

// Collide two circles elastically (with conservation of momentum)
export function resolveElasticCollision(p1: GamePlayer, p2: GamePlayer) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < p1.radius + p2.radius) {
    // Prevent overlapping by separating them
    const overlap = p1.radius + p2.radius - distance;
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Push away equally or based on size
    const totalMass = p1.radius + p2.radius;
    const ratio1 = p2.radius / totalMass;
    const ratio2 = p1.radius / totalMass;
    
    p1.x -= nx * overlap * ratio1;
    p1.y -= ny * overlap * ratio1;
    p2.x += nx * overlap * ratio2;
    p2.y += ny * overlap * ratio2;
    
    // Elastic rebound velocities
    const kx = p1.vx - p2.vx;
    const ky = p1.vy - p2.vy;
    const p = 2 * (nx * kx + ny * ky) / totalMass;
    
    p1.vx -= p * p2.radius * nx;
    p1.vy -= p * p2.radius * ny;
    p2.vx += p * p1.radius * nx;
    p2.vy += p * p1.radius * ny;
  }
}

// Generate new pollen particles on map
export function spawnPollenList(count: number): GamePollen[] {
  const colors = [
    '#ff4a5a', // Coral Red
    '#ffd166', // Golden Orchid
    '#06d6a0', // Lime Clover
    '#118ab2', // Cosmic Aqua
    '#ff85a1', // Sakura Pink
    '#8338ec', // Violet Orchid
  ];
  
  const pollens: GamePollen[] = [];
  for (let i = 0; i < count; i++) {
    pollens.push({
      id: `pollen-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.random() * (WORLD_WIDTH - 40) + 20,
      y: Math.random() * (WORLD_HEIGHT - 40) + 20,
      value: Math.floor(Math.random() * 5) + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: Math.floor(Math.random() * 4) + 5,
    });
  }
  return pollens;
}

// Update single player state
export function updatePlayerPhysics(player: GamePlayer, targetAngle: number, isMoving: boolean) {
  // Movement intent acceleration
  if (isMoving) {
    const ax = Math.cos(targetAngle) * 0.45;
    const ay = Math.sin(targetAngle) * 0.45;
    player.vx += ax;
    player.vy += ay;
    player.angle = targetAngle;
  }
  
  // Apply environment drag
  player.vx *= FRICTION;
  player.vy *= FRICTION;
  
  // Speed limit cap
  const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
  if (speed > MAX_SPEED) {
    player.vx = (player.vx / speed) * MAX_SPEED;
    player.vy = (player.vy / speed) * MAX_SPEED;
  }
  
  // Update positions
  player.x += player.vx;
  player.y += player.vy;
  
  // Restrict to map boundaries
  const constrained = constrainToWorld({ x: player.x, y: player.y }, player.radius);
  player.x = constrained.x;
  player.y = constrained.y;
}

// Calculate Orbit positions for Orbiting Petals
export function getOrbitingPetalPos(
  centerX: number,
  centerY: number,
  parentRadius: number,
  index: number,
  totalPetals: number,
  tickCount: number
): Vector2D {
  const baseAngle = (tickCount * 0.035) % (Math.PI * 2);
  const offset = (index / totalPetals) * Math.PI * 2;
  const currentAngle = baseAngle + offset;
  
  // Petals orbit slightly offset from actual boundary edge
  const orbitDistance = parentRadius + 14; 
  return {
    x: centerX + Math.cos(currentAngle) * orbitDistance,
    y: centerY + Math.sin(currentAngle) * orbitDistance,
  };
}
