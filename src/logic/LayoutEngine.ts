import * as THREE from 'three';
import { PALETTES } from '../config/tokens';
import type { PaletteKey } from '../config/tokens';

export type CompositionType = 'CHAOS' | 'STAGE' | 'BORDER' | 'STUDIO' | 'STUDIO_SCENOGRAPHY';

export interface BubbleData {
  id: number;
  palette: { base: string; mid: string; rim: string };
  position: [number, number, number];
  scale: number;
  movement: {
    speed: number;
    floatIntensity: number;
    rotationIntensity: number;
  };
  distortSpeed: number;
  distortFactor: number;
  rotationOffset: [number, number, number];
  role: string;
}

const PHI = 1.618;
// Skale wg Złotego Podziału
const S_MICRO   = 0.5;
const S_ACCENT  = S_MICRO * PHI;    
const S_SUPPORT = S_ACCENT * PHI;   
const S_ANCHOR  = S_SUPPORT * PHI;  
const Y_BASE_SPREAD = 0.25; 

// --- HELPERY ---
const getRandomPalette = (theme: any[]) => theme[Math.floor(Math.random() * theme.length)];

const checkSeparation2D = (
  candidatePos: THREE.Vector3, 
  radius: number, 
  existingBubbles: BubbleData[],
  minFactor: number = 1.1 
) => {
  for (let b of existingBubbles) {
    const dx = candidatePos.x - b.position[0];
    const dy = candidatePos.y - b.position[1];
    const dist2D = Math.sqrt(dx*dx + dy*dy); 
    const requiredDist = (radius + b.scale / 2) * minFactor;
    if (dist2D < requiredDist) return true; 
  }
  return false;
};

// --- GŁÓWNY SILNIK ---

export const generateLayout = (
  count: number,
  composition: CompositionType,
  mode: PaletteKey
): BubbleData[] => {
  
  const globalTheme = PALETTES[mode] || PALETTES['MIX'];
  const bubbles: BubbleData[] = [];

  // =========================================================
  // 1. SCENA (SCENOGRAPHY) - Przywrócona matematyka
  // =========================================================
  if (composition === 'STUDIO_SCENOGRAPHY') {
    const definitions = [
      { role: 'ANCHOR',  scale: S_ANCHOR },  
      { role: 'SUPPORT', scale: S_SUPPORT }, { role: 'SUPPORT', scale: S_SUPPORT },
      { role: 'ACCENT',  scale: S_ACCENT },  { role: 'ACCENT',  scale: S_ACCENT }, { role: 'ACCENT',  scale: S_ACCENT },
      { role: 'MICRO',   scale: S_MICRO },   { role: 'MICRO',   scale: S_MICRO },   { role: 'MICRO',   scale: S_MICRO },
      { role: 'MICRO',   scale: S_MICRO },   { role: 'MICRO',   scale: S_MICRO },
    ];

    const anchorSide = Math.random() > 0.5 ? 1 : -1; 
    let anchorX = 0;

    definitions.forEach((def, i) => {
      const rawPalette = getRandomPalette(globalTheme);
      let finalPalette = { ...rawPalette };

      // Koloryzacja
      if (def.role === 'ANCHOR' || def.role === 'SUPPORT') {
        finalPalette.mid = rawPalette.base; 
        finalPalette.base = rawPalette.base;
        finalPalette.rim = rawPalette.mid;   
      } else {
        finalPalette.mid = rawPalette.mid;
        finalPalette.base = rawPalette.base; 
        finalPalette.rim = rawPalette.rim;     
      }

      let bestPos = new THREE.Vector3(0, -100, 0);
      let found = false;

      // --- PRZYWRÓCONA LOGIKA POZYCJONOWANIA ---
      for (let attempt = 0; attempt < 200; attempt++) {
        const candidate = new THREE.Vector3();
        
        // Oś X - Golden Balance
        if (def.role === 'ANCHOR') {
           const offset = 1.5 + Math.random() * 0.5;
           candidate.x = anchorSide * offset; 
           anchorX = candidate.x; 
        } else if (def.role === 'SUPPORT') {
           const isCounter = Math.random() > 0.3;
           if (isCounter) {
             candidate.x = -anchorSide * (2.0 + Math.random() * 2.5);
           } else {
             candidate.x = anchorX + (anchorSide * (1.5 + Math.random()));
           }
        } else {
           candidate.x = (Math.random() - 0.5) * 10.0;
        }

        // Oś Y - Amplituda
        const yCenter = -0.5;
        let amp = 0.5;
        if (def.role === 'ANCHOR') amp = Y_BASE_SPREAD;
        else if (def.role === 'SUPPORT') amp = Y_BASE_SPREAD * PHI;
        else if (def.role === 'ACCENT') amp = Y_BASE_SPREAD * PHI * PHI;
        else amp = Y_BASE_SPREAD * PHI * PHI * PHI;
        
        candidate.y = yCenter + (Math.random() - 0.5) * (amp * 2);
        
        // Clamp Y (Ograniczenie góra/dół)
        const maxUp = (def.role === 'ANCHOR' || def.role === 'SUPPORT') ? 0.0 : 0.5;
        const maxDown = (def.role === 'ANCHOR' || def.role === 'SUPPORT') ? -1.0 : -1.5;
        if (candidate.y > maxUp) candidate.y = maxUp;
        if (candidate.y < maxDown) candidate.y = maxDown;

        // Oś Z - Głębia
        let zBase = 0;
        if (def.role === 'ANCHOR') zBase = -2.5;
        else if (def.role === 'SUPPORT') zBase = -1.0;
        else if (def.role === 'ACCENT') zBase = 0.5;
        else zBase = 2.0; // MICRO
        candidate.z = zBase + (Math.random() - 0.5);

        // Kolizja
        let sep = 1.1;
        if (def.role === 'MICRO') sep = 1.05;
        if (!checkSeparation2D(candidate, def.scale / 2, bubbles, sep)) {
           bestPos = candidate; found = true; break;
        }
      }
      if (!found) bestPos.set((Math.random()-0.5)*12, -15, 0);

      // FIZYKA RUCHU
      // Scena jest statyczna/dostojna. Mały floatIntensity, żeby nie zepsuć układu.
      const movement = {
        speed: 0.4,
        floatIntensity: def.role === 'ANCHOR' ? 0.1 : 0.3, 
        rotationIntensity: 0.2
      };

      // STYL DEFORMACJI (Distort)
      // Przekazujemy tu bazowe wartości, ale materiał Glutek je podkręci
      const distortF = def.role === 'ANCHOR' ? 0.05 : 0.2;

      bubbles.push({
        id: i,
        palette: finalPalette,
        position: [bestPos.x, bestPos.y, bestPos.z],
        scale: def.scale,
        movement: movement,
        distortSpeed: 0.2, 
        distortFactor: distortF,
        rotationOffset: [Math.random()*3, Math.random()*3, 0],
        role: def.role
      });
    });
  }
  
  // =========================================================
  // 2. RAMA (BORDER/BACKDROP)
  // =========================================================
  else if (composition === 'BORDER') {
    const actualCount = 20;
    for (let i = 0; i < actualCount; i++) {
        const rawPalette = getRandomPalette(globalTheme);
        const isHero = i === 0;
        
        let pos: [number, number, number];
        let scale = 1;

        if (isHero) {
            pos = [(Math.random()-0.5)*2.0, (Math.random()-0.5)*1.0, -6.0];
            scale = 4.0;
        } else {
            const z = -2.5 - Math.random() * 5.0;
            const x = (Math.random() - 0.5) * (14 + Math.abs(z)*0.5); 
            const y = (Math.random() - 0.5) * 8.0;
            pos = [x, y, z];
            scale = 0.2 + Math.random() * 0.6; 
        }

        const movement = {
            speed: isHero ? 0.2 : 0.8,
            floatIntensity: isHero ? 0.1 : 0.5,
            rotationIntensity: 0.4
        };

        let finalPalette = { ...rawPalette };
        if (isHero) { finalPalette.mid = rawPalette.base; finalPalette.base = rawPalette.base; }
        else { finalPalette.mid = Math.random() > 0.3 ? rawPalette.rim : rawPalette.mid; }

        bubbles.push({
            id: i, palette: finalPalette, position: pos, scale: scale,
            movement: movement,
            distortSpeed: 1.0, distortFactor: isHero ? 0.1 : 0.4,
            rotationOffset: [0,0,0], role: isHero ? 'HERO' : 'DECO'
        });
    }
  }

  // =========================================================
  // 3. MOLEKUŁA (STUDIO/ORGANIC)
  // =========================================================
  else if (composition === 'STUDIO') {
    const actualCount = 20;
    for (let i = 0; i < actualCount; i++) {
        const rawPalette = getRandomPalette(globalTheme);
        const isHero = i === 0;
        
        // Logika "Kałuży" na podłodze
        let pos: [number, number, number];
        if (isHero) {
           pos = [(Math.random()-0.5)*0.5, -1.0, (Math.random()-0.5)*0.5]; 
        } else {
           // Proste szukanie miejsca wokół
           let foundPos = new THREE.Vector3((Math.random()-0.5)*8, -1.0, (Math.random()-0.5)*4);
           // (Tu można dodać pętlę kolizji, ale dla uproszczenia wklejam losowanie)
           pos = [foundPos.x, -1.5 + Math.random(), foundPos.z];
        }

        const movement = {
            speed: isHero ? 0.1 : 0.4,
            floatIntensity: isHero ? 0.05 : 0.2, // Ciężkie
            rotationIntensity: 0.1
        };

        let finalPalette = { ...rawPalette };
        if (isHero) { finalPalette.mid = rawPalette.base; finalPalette.base = rawPalette.base; }
        else { finalPalette.mid = Math.random() > 0.5 ? rawPalette.rim : rawPalette.mid; }

        bubbles.push({
            id: i, palette: finalPalette, position: pos, scale: isHero ? 2.5 : 0.8,
            movement: movement,
            distortSpeed: 0.5, distortFactor: 0.2,
            rotationOffset: [0,0,0], role: isHero ? 'HERO' : 'DECO'
        });
    }
  }

  // =========================================================
  // 4. CHAOS
  // =========================================================
  else {
    for (let i = 0; i < count; i++) {
        const rawPalette = getRandomPalette(globalTheme);
        const pos: [number, number, number] = [(Math.random()-0.5)*14, (Math.random()-0.5)*9, (Math.random()-0.5)*8];
        const scale = 0.5 + Math.random() * 1.5;
        
        const movement = {
            speed: 1.0 + Math.random(),
            floatIntensity: 1.0 + Math.random() * 0.5,
            rotationIntensity: 1.0
        };

        bubbles.push({
            id: i, palette: rawPalette, position: pos, scale: scale,
            movement: movement,
            distortSpeed: 1.0, distortFactor: 0.4,
            rotationOffset: [Math.random(), Math.random(), 0], role: 'CHAOS'
        });
    }
  }

  return bubbles;
};