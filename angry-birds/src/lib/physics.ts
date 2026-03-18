// A lightweight physics and game engine tailored for an Angry Birds style game

export type EntityType = 'bird' | 'pig' | 'block' | 'particle';
export type Material = 'wood' | 'stone' | 'ice' | 'none';

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  radius?: number;
  mass: number;
  hp: number;
  maxHp: number;
  material: Material;
  birdType?: string;
  isStatic: boolean;
  active: boolean;
  rotation: number;
  vr: number;
}

export class GameEngine {
  entities: Entity[] = [];
  gravity: number = 0.4;
  groundY: number = 500;
  width: number = 1600;
  height: number = 600;
  slingshotPos = { x: 200, y: 400 };
  dragStart = { x: 0, y: 0 };
  dragCurrent = { x: 0, y: 0 };
  isDragging = false;
  state: 'aiming' | 'flying' | 'settling' | 'finished' = 'aiming';
  
  currentBirdIndex = 0;
  birdsAvailable: string[] = [];
  score = 0;
  
  onWin?: (score: number, stars: number) => void;
  onLose?: () => void;
  onScore?: (points: number, x: number, y: number) => void;

  constructor(width: number, height: number, groundY: number) {
    this.width = width;
    this.height = height;
    this.groundY = groundY;
    this.slingshotPos = { x: width * 0.15, y: groundY - 120 };
  }

  loadLevel(birds: string[], blocks: any[], pigs: any[]) {
    this.entities = [];
    this.birdsAvailable = [...birds];
    this.currentBirdIndex = 0;
    this.score = 0;
    this.state = 'aiming';

    // Add blocks
    blocks.forEach((b, i) => {
      this.entities.push({
        id: `block_${i}`,
        type: 'block',
        x: b.x, y: b.y, w: b.w, h: b.h,
        vx: 0, vy: 0, vr: 0, rotation: 0,
        mass: b.material === 'stone' ? 5 : b.material === 'wood' ? 2 : 1,
        hp: b.material === 'stone' ? 100 : b.material === 'wood' ? 50 : 20,
        maxHp: b.material === 'stone' ? 100 : b.material === 'wood' ? 50 : 20,
        material: b.material,
        isStatic: false,
        active: true
      });
    });

    // Add pigs
    pigs.forEach((p, i) => {
      this.entities.push({
        id: `pig_${i}`,
        type: 'pig',
        x: p.x, y: p.y, w: p.r*2, h: p.r*2, radius: p.r,
        vx: 0, vy: 0, vr: 0, rotation: 0,
        mass: 2,
        hp: 30, maxHp: 30,
        material: 'none',
        isStatic: false,
        active: true
      });
    });

    this.spawnNextBird();
  }

  spawnNextBird() {
    if (this.currentBirdIndex >= this.birdsAvailable.length) {
      this.checkEndGame();
      return;
    }
    
    const birdType = this.birdsAvailable[this.currentBirdIndex];
    this.entities.push({
      id: `bird_${this.currentBirdIndex}`,
      type: 'bird',
      birdType,
      x: this.slingshotPos.x,
      y: this.slingshotPos.y,
      w: 40, h: 40, radius: 20,
      vx: 0, vy: 0, vr: 0, rotation: 0,
      mass: birdType === 'big_red' ? 6 : 3,
      hp: 100, maxHp: 100,
      material: 'none',
      isStatic: true,
      active: true
    });
    this.state = 'aiming';
  }

  getActiveBird() {
    return this.entities.find(e => e.type === 'bird' && e.active && e.id === `bird_${this.currentBirdIndex}`);
  }

  handlePointerDown(x: number, y: number) {
    if (this.state !== 'aiming') return;
    const bird = this.getActiveBird();
    if (!bird) return;

    const dx = x - bird.x;
    const dy = y - bird.y;
    if (Math.sqrt(dx*dx + dy*dy) < 40) {
      this.isDragging = true;
      this.dragStart = { x, y };
      this.dragCurrent = { x, y };
    }
  }

  handlePointerMove(x: number, y: number) {
    if (!this.isDragging) return;
    this.dragCurrent = { x, y };
    
    const bird = this.getActiveBird();
    if (!bird) return;

    // Limit drag radius
    const maxDrag = 100;
    let dx = this.dragCurrent.x - this.slingshotPos.x;
    let dy = this.dragCurrent.y - this.slingshotPos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > maxDrag) {
      dx = (dx / dist) * maxDrag;
      dy = (dy / dist) * maxDrag;
    }
    
    bird.x = this.slingshotPos.x + dx;
    bird.y = this.slingshotPos.y + dy;
  }

  handlePointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    
    const bird = this.getActiveBird();
    if (!bird) return;

    const dx = this.slingshotPos.x - bird.x;
    const dy = this.slingshotPos.y - bird.y;
    
    // Launch power multiplier
    const power = 0.25;
    bird.vx = dx * power;
    bird.vy = dy * power;
    bird.isStatic = false;
    this.state = 'flying';
  }

  activateSpecialAbility() {
    if (this.state !== 'flying') return;
    const bird = this.getActiveBird();
    if (!bird || bird.isStatic) return;

    if (bird.birdType === 'yellow') {
      bird.vx *= 1.5;
      bird.vy *= 1.5;
    } else if (bird.birdType === 'black') {
      // Explode
      this.createExplosion(bird.x, bird.y, 150, 100);
      bird.active = false;
    } else if (bird.birdType === 'blue') {
      // Split into 3 (simplified: just spawn 2 more birds near it)
      for(let i=-1; i<=1; i+=2) {
        this.entities.push({
          ...bird,
          id: `bird_clone_${Math.random()}`,
          vy: bird.vy + (i*2),
          mass: 1.5,
          radius: 12
        });
      }
      bird.mass = 1.5;
      bird.radius = 12;
    }
    // Only once per bird, but we don't track it rigidly here for brevity
  }

  createExplosion(x: number, y: number, radius: number, damage: number) {
    this.entities.forEach(e => {
      if (e.type === 'block' || e.type === 'pig') {
        const cx = e.x + e.w/2;
        const cy = e.y + e.h/2;
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < radius) {
          const power = (radius - dist) / radius;
          e.vx += (dx / dist) * power * 15;
          e.vy += (dy / dist) * power * 15;
          this.damageEntity(e, damage * power);
        }
      }
    });
  }

  damageEntity(e: Entity, amt: number) {
    if (!e.active || e.type === 'bird') return;
    e.hp -= amt;
    if (e.hp <= 0) {
      e.active = false;
      const pts = e.type === 'pig' ? 5000 : e.maxHp * 10;
      this.score += pts;
      if (this.onScore) this.onScore(pts, e.x, e.y);
      this.spawnParticles(e.x, e.y, e.material);
    }
  }

  spawnParticles(x: number, y: number, mat: string) {
    // simplified visual effect logic usually handled in draw
  }

  update() {
    if (this.state === 'finished') return;

    let isMoving = false;

    // Apply physics
    this.entities.forEach(e => {
      if (!e.active || e.isStatic) return;

      e.vy += this.gravity;
      e.x += e.vx;
      e.y += e.vy;
      e.rotation += e.vr;

      // Friction & air resistance
      e.vx *= 0.99;
      e.vy *= 0.99;
      e.vr *= 0.95;

      if (Math.abs(e.vx) > 0.5 || Math.abs(e.vy) > 0.5) {
        isMoving = true;
      }

      // Ground collision
      const bottom = e.radius ? e.y + e.radius : e.y + e.h;
      if (bottom > this.groundY) {
        e.y = this.groundY - (e.radius || e.h);
        e.vy *= -0.4;
        e.vx *= 0.8;
        if (Math.abs(e.vy) < 1) e.vy = 0;
        
        // Damage on hard impact
        if (Math.abs(e.vy) > 5) this.damageEntity(e, Math.abs(e.vy) * 2);
      }
    });

    // Check collisions between entities (O(n^2) - okay for ~50 entities)
    for (let i = 0; i < this.entities.length; i++) {
      const a = this.entities[i];
      if (!a.active || a.isStatic && a.type !== 'bird') continue;
      
      for (let j = i + 1; j < this.entities.length; j++) {
        const b = this.entities[j];
        if (!b.active) continue;

        if (this.checkCollision(a, b)) {
          this.resolveCollision(a, b);
        }
      }
    }

    if (this.state === 'flying' && !isMoving) {
      this.state = 'settling';
      setTimeout(() => {
        this.currentBirdIndex++;
        this.spawnNextBird();
      }, 1500);
    }

    // Clean up dead
    this.entities = this.entities.filter(e => e.active);

    if (this.state === 'aiming' || this.state === 'settling') {
      this.checkEndGame();
    }
  }

  checkCollision(a: Entity, b: Entity) {
    // Simplified AABB + Circle
    const aIsCirc = !!a.radius;
    const bIsCirc = !!b.radius;

    if (aIsCirc && bIsCirc) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return (dx*dx + dy*dy) < Math.pow(a.radius! + b.radius!, 2);
    }

    if (!aIsCirc && !bIsCirc) {
      return a.x < b.x + b.w && a.x + a.w > b.x &&
             a.y < b.y + b.h && a.y + a.h > b.y;
    }

    const circ = aIsCirc ? a : b;
    const rect = aIsCirc ? b : a;

    let testX = circ.x;
    let testY = circ.y;

    if (circ.x < rect.x) testX = rect.x;
    else if (circ.x > rect.x + rect.w) testX = rect.x + rect.w;
    
    if (circ.y < rect.y) testY = rect.y;
    else if (circ.y > rect.y + rect.h) testY = rect.y + rect.h;

    const distX = circ.x - testX;
    const distY = circ.y - testY;
    return (distX*distX + distY*distY) <= (circ.radius! * circ.radius!);
  }

  resolveCollision(a: Entity, b: Entity) {
    // Simple elastic bounce & momentum
    const relVx = a.vx - b.vx;
    const relVy = a.vy - b.vy;
    const speed = Math.sqrt(relVx*relVx + relVy*relVy);

    // Bounce
    if (a.type === 'bird' || b.type === 'bird') {
      a.vx *= 0.8; a.vy *= 0.8;
      b.vx *= 0.8; b.vy *= 0.8;
    } else {
      // Stack resting
      if (a.y < b.y) {
        a.y = b.y - (a.h || a.radius! * 2);
        a.vy = 0;
      } else {
        b.y = a.y - (b.h || b.radius! * 2);
        b.vy = 0;
      }
    }

    // Damage
    if (speed > 2) {
      const dmg = speed * 3;
      this.damageEntity(a, dmg);
      this.damageEntity(b, dmg);
      
      // Transfer momentum roughly
      const am = a.mass;
      const bm = b.mass;
      a.vx -= (relVx * bm) / (am + bm);
      a.vy -= (relVy * bm) / (am + bm);
      b.vx += (relVx * am) / (am + bm);
      b.vy += (relVy * am) / (am + bm);
      
      a.vr += (Math.random() - 0.5) * speed * 0.1;
      b.vr += (Math.random() - 0.5) * speed * 0.1;
    }
  }

  checkEndGame() {
    const pigsAlive = this.entities.filter(e => e.type === 'pig' && e.active).length;
    if (pigsAlive === 0) {
      this.state = 'finished';
      // calculate stars
      const birdsLeft = this.birdsAvailable.length - this.currentBirdIndex;
      const totalScore = this.score + (birdsLeft * 10000);
      let stars = 1;
      if (birdsLeft > 0) stars = 2;
      if (birdsLeft > 1) stars = 3;
      if (this.onWin) this.onWin(totalScore, stars);
    } else if (this.currentBirdIndex >= this.birdsAvailable.length && this.state === 'settling') {
      this.state = 'finished';
      if (this.onLose) this.onLose();
    }
  }
}
