import * as THREE from 'three';
import { PALETTES } from '../config/tokens';
import type { PaletteKey } from '../config/tokens';

export type CompositionType = 'CHAOS' | 'STAGE' | 'BORDER' | 'STUDIO' | 'STUDIO_SCENOGRAPHY';

export interface BubbleData {
  id: number;
  palette: { base: string; mid: string; rim: string };
  position: [number, number, number];
  scale: number;
  speed: number;
  distortSpeed: number;
  distortFactor: number;
  rotationOffset: [number, number, number];
  stiffness: number;
  role: string;
}

const PHI = 1.618;
// SKALE
const S_MICRO   = 0.5;
const S_ACCENT  = S_MICRO * PHI;    
const S_SUPPORT = S_ACCENT * PHI;   
const S_ANCHOR  = S_SUPPORT * PHI;  
const Y_BASE_SPREAD = 0.25; 

// --- FUNKCJE POMOCNICZE ---

const checkCollision = (
  candidatePos: THREE.Vector3, 
  radius: number, 
  existingBubbles: BubbleData[],
  margin: number = 0.0
) => {
  for (let b of existingBubbles) {
    const dist = candidatePos.distanceTo(new THREE.Vector3(...b.position));
    // margin ujemny = większy ścisk, dodatni = większy odstęp
    const minDistance = (radius + b.scale / 2) + margin; 
    if (dist < minDistance) return true; 
  }
  return false;
};

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

  // Helper do losowania koloru z palety
  const getRandomPalette = () => globalTheme[Math.floor(Math.random() * globalTheme.length)];

  // =========================================================
  // 1. SCENOGRAPHY (Sceno) - Graphic Layout
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
      const rawPalette = getRandomPalette();
      let finalPalette = { ...rawPalette };

      // Koloryzacja: Duże = Ciemne/Baza, Małe = Jasne/Rim
      if (def.role === 'ANCHOR' || def.role === 'SUPPORT') {
        finalPalette.mid = rawPalette.base; 
        finalPalette.base = rawPalette.base;
        finalPalette.rim = rawPalette.mid;   
      } else {
        finalPalette.mid = rawPalette.mid;
        finalPalette.base = rawPalette.base; 
        finalPalette.rim = rawPalette.rim; // Używamy rim, nie white (fix dla Misty)     
      }

      let bestPos = new THREE.Vector3(0, -100, 0);
      let found = false;

      for (let attempt = 0; attempt < 200; attempt++) {
        const candidate = new THREE.Vector3();
        
        // X Logic
        if (def.role === 'ANCHOR') {
           candidate.x = anchorSide * (1.5 + Math.random() * 0.5); 
           anchorX = candidate.x; 
        } else if (def.role === 'SUPPORT') {
           const isCounter = Math.random() > 0.3;
           candidate.x = isCounter ? -anchorSide * (2.0 + Math.random() * 2.5) : anchorX + (anchorSide * (1.5 + Math.random()));
        } else {
           candidate.x = (Math.random() - 0.5) * 10.0;
        }

        // Y Logic (Spread)
        const yCenter = -0.5;
        let amp = 0.5;
        if (def.role === 'ANCHOR') amp = Y_BASE_SPREAD;
        if (def.role === 'SUPPORT') amp = Y_BASE_SPREAD * PHI;
        if (def.role === 'ACCENT') amp = Y_BASE_SPREAD * PHI * PHI;
        
        candidate.y = yCenter + (Math.random() - 0.5) * (amp * 2);
        // Clamp Y
        const maxUp = (def.role === 'ANCHOR' || def.role === 'SUPPORT') ? 0.0 : 0.5;
        const maxDown = (def.role === 'ANCHOR' || def.role === 'SUPPORT') ? -1.0 : -1.5;
        candidate.y = Math.max(Math.min(candidate.y, maxUp), maxDown);

        // Z Logic
        let zBase = 0;
        if (def.role === 'ANCHOR') zBase = -2.5;
        if (def.role === 'SUPPORT') zBase = -1.0;
        if (def.role === 'ACCENT') zBase = 0.5;
        if (def.role === 'MICRO') zBase = 2.0;
        candidate.z = zBase + (Math.random() - 0.5);

        // Collision Check
        let sep = 1.1;
        if (def.role === 'MICRO') sep = 1.05;
        if (!checkSeparation2D(candidate, def.scale / 2, bubbles, sep)) {
           bestPos = candidate; found = true; break;
        }
      }
      if (!found) bestPos.set((Math.random()-0.5)*12, -15, 0);

      bubbles.push({
        id: i,
        palette: finalPalette,
        position: [bestPos.x, bestPos.y, bestPos.z],
        scale: def.scale,
        speed: 0.2, distortSpeed: 0.1, distortFactor: def.role === 'ANCHOR' ? 0.02 : 0.0,
        rotationOffset: [Math.random()*3, Math.random()*3, 0],
        stiffness: 1.0, role: def.role
      });
    });
  }
  
  // =========================================================
  // 2. BACKDROP (Border) - Tło produktowe
  // =========================================================
  else if (composition === 'BORDER') {
    const actualCount = 20;
    
    for (let i = 0; i < actualCount; i++) {
        const rawPalette = getRandomPalette();
        const isHero = i === 0;
        let pos: [number, number, number];
        let scale = 1;
        let role = 'DECO';

        if (isHero) {
            // Wielki kształt w tle (BEZ ZMIAN)
            pos = [(Math.random()-0.5)*2.0, (Math.random()-0.5)*1.0, -6.0];
            scale = 4.0;
            role = 'HERO_PLACEHOLDER';
        } else {
            // Drobnica dookoła - TERAZ DUŻO MNIEJSZA
            const z = -2.5 - Math.random() * 5.0;
            const x = (Math.random() - 0.5) * (14 + Math.abs(z)*0.5); 
            const y = (Math.random() - 0.5) * 8.0;
            pos = [x, y, z];
            
            // ZMIANA TUTAJ:
            // Było: 0.5 do 2.5
            // Jest: 0.2 do 0.8 (Tylko drobne dodatki)
            scale = 0.2 + Math.random() * 0.6; 
        }

        // Kolory
        let finalPalette = { ...rawPalette };
        if (isHero) {
            finalPalette.mid = rawPalette.base; 
            finalPalette.base = rawPalette.base;
        } else {
            // Drobnicę częściej robimy jasną (Rim), żeby wyglądała jak bliki świetlne
            // Zwiększyłem szansę na jasny kolor do 70%
            finalPalette.mid = Math.random() > 0.3 ? rawPalette.rim : rawPalette.mid;
        }

        bubbles.push({
            id: i, palette: finalPalette, position: pos, scale: scale,
            speed: isHero ? 0.2 : 1.0, distortSpeed: 1.0, distortFactor: isHero ? 0.05 : 0.3,
            rotationOffset: [0,0,0], stiffness: isHero ? 0.9 : 0.5, role
        });
    }
  }

  // =========================================================
  // 3. ORGANIC (Studio) - Rozsypane na podłodze
  // =========================================================
  else if (composition === 'STUDIO') {
    const actualCount = 20;

    for (let i = 0; i < actualCount; i++) {
        const rawPalette = getRandomPalette();
        const isHero = i === 0;
        let pos: [number, number, number] = [0,0,0];
        let scale = 1;

        if (isHero) {
            // Główny obiekt na środku podłogi
            pos = [(Math.random()-0.5)*1.0, -0.5, (Math.random()-0.5)*1.0];
            scale = 2.5;
        } else {
            // Reszta rozsypana
            let found = false;
            for(let k=0; k<50; k++) {
                 const p = new THREE.Vector3((Math.random()-0.5)*9.0, -1.5+Math.random()*2.5, (Math.random()-0.5)*5.0);
                 if(!checkCollision(p, 0.6, bubbles, -0.2)) { // -0.2 = lekkie przenikanie dozwolone
                    pos = [p.x, p.y, p.z]; found = true; break; 
                 }
            }
            if(!found) pos = [(Math.random()-0.5)*10, -10, 0];
            scale = 0.6 + Math.random() * 0.9;
        }

        let finalPalette = { ...rawPalette };
        if (isHero || scale > 1.5) {
            finalPalette.mid = rawPalette.base; finalPalette.base = rawPalette.base;
        } else {
            finalPalette.mid = Math.random() > 0.5 ? rawPalette.rim : rawPalette.mid;
        }

        bubbles.push({
            id: i, palette: finalPalette, position: pos, scale: scale,
            speed: isHero ? 0.2 : 1.0, distortSpeed: 1.0, distortFactor: isHero ? 0.05 : 0.3,
            rotationOffset: [0,0,0], stiffness: isHero ? 0.9 : 0.5, role: isHero ? 'HERO' : 'DECO'
        });
    }
  }

  // =========================================================
  // 4. CHAOS (Default)
  // =========================================================
  else {
    for (let i = 0; i < count; i++) {
        const rawPalette = getRandomPalette();
        const pos: [number, number, number] = [(Math.random()-0.5)*14, (Math.random()-0.5)*9, (Math.random()-0.5)*8];
        const scale = 0.5 + Math.random() * 1.5;
        
        bubbles.push({
            id: i, palette: rawPalette, position: pos, scale: scale,
            speed: 1.0, distortSpeed: 1.0, distortFactor: 0.3,
            rotationOffset: [0,0,0], stiffness: 0.5, role: 'CHAOS'
        });
    }
  }

  return bubbles;
};