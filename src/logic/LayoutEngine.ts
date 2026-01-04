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

// SKALE WG ZŁOTEGO PODZIAŁU
const S_MICRO   = 0.5;
const S_ACCENT  = S_MICRO * PHI;    // ~0.81
const S_SUPPORT = S_ACCENT * PHI;   // ~1.31
const S_ANCHOR  = S_SUPPORT * PHI;  // ~2.12

// AMPLITUDA PIONOWA (Baza do rozwarstwienia Y)
const Y_BASE_SPREAD = 0.25; 

// Funkcja kolizji 3D (Legacy)
const checkCollisionOld = (
  candidatePos: THREE.Vector3, 
  radius: number, 
  existingBubbles: { position: [number, number, number], scale: number }[]
) => {
  for (let b of existingBubbles) {
    const dist = candidatePos.distanceTo(new THREE.Vector3(...b.position));
    const minDistance = (radius + b.scale / 2) * 0.94; 
    if (dist < minDistance) return true; 
  }
  return false;
};

// Funkcja separacji 2D (Graphic First)
const checkSeparation = (
  candidatePos: THREE.Vector3, 
  radius: number, 
  existingBubbles: { position: [number, number, number], scale: number }[],
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

export const generateLayout = (
  count: number,
  composition: CompositionType,
  mode: PaletteKey
): BubbleData[] => {
  
  const globalTheme = PALETTES[mode] || PALETTES['MIX'];
  const bubbles: BubbleData[] = [];

  // =========================================================
  // TRYB: STUDIO_SCENOGRAPHY
  // =========================================================
  if (composition === 'STUDIO_SCENOGRAPHY') {
    
    const definitions = [
      { role: 'ANCHOR',  scale: S_ANCHOR },  
      
      { role: 'SUPPORT', scale: S_SUPPORT }, 
      { role: 'SUPPORT', scale: S_SUPPORT },

      { role: 'ACCENT',  scale: S_ACCENT },  
      { role: 'ACCENT',  scale: S_ACCENT },
      { role: 'ACCENT',  scale: S_ACCENT },

      { role: 'MICRO',   scale: S_MICRO },   
      { role: 'MICRO',   scale: S_MICRO },
      { role: 'MICRO',   scale: S_MICRO },
      { role: 'MICRO',   scale: S_MICRO },
      { role: 'MICRO',   scale: S_MICRO },
    ];

    const anchorSide = Math.random() > 0.5 ? 1 : -1; 
    let anchorX = 0;

    definitions.forEach((def, i) => {
      // 1. POBIERAMY PALETĘ
      const rawPalette = globalTheme[Math.floor(Math.random() * globalTheme.length)];
      
      // 2. PRZYPISANIE KOLORU WG MASY
      let finalPalette = { ...rawPalette };

      if (def.role === 'ANCHOR' || def.role === 'SUPPORT') {
        finalPalette.mid = rawPalette.base; 
        finalPalette.base = rawPalette.base;
        finalPalette.rim = rawPalette.mid;   
      } else {
        finalPalette.mid = rawPalette.mid;
        finalPalette.base = rawPalette.base; 
        finalPalette.rim = '#FFFFFF';        
      }
      
      // Alternatywne logiczne przypisanie dla spójności
      if (def.role === 'ANCHOR' || def.role === 'SUPPORT') {
        finalPalette.base = rawPalette.mid; 
      } else {
        const variant = Math.random();
        if (variant > 0.6) finalPalette.mid = rawPalette.rim; 
        else finalPalette.mid = rawPalette.base; 
      }

      let bestPos = new THREE.Vector3(0, -100, 0);
      let found = false;
      const attempts = 500; 

      for (let attempt = 0; attempt < attempts; attempt++) {
        const candidate = new THREE.Vector3();

        // --- X AXIS (Golden Balance) ---
        if (def.role === 'ANCHOR') {
           const offset = 1.5 + Math.random() * 0.5;
           candidate.x = anchorSide * offset; 
           anchorX = candidate.x; 
        } else if (def.role === 'SUPPORT') {
           const isCounterWeight = Math.random() > 0.3; 
           if (isCounterWeight) {
             candidate.x = -anchorSide * (2.0 + Math.random() * 2.5);
           } else {
             candidate.x = anchorX + (anchorSide * (1.5 + Math.random()));
           }
        } else {
           candidate.x = (Math.random() - 0.5) * 10.0;
        }

        // --- Y AXIS (GOLDEN AMPLITUDE) ---
        const yCenter = -0.5;
        let yAmplitude = 0;

        switch (def.role) {
            case 'ANCHOR':  yAmplitude = Y_BASE_SPREAD; break;
            case 'SUPPORT': yAmplitude = Y_BASE_SPREAD * PHI; break;
            case 'ACCENT':  yAmplitude = Y_BASE_SPREAD * PHI * PHI; break;
            case 'MICRO':   yAmplitude = Y_BASE_SPREAD * PHI * PHI * PHI; break;
            default:        yAmplitude = 0.5;
        }

        candidate.y = yCenter + (Math.random() - 0.5) * (yAmplitude * 2);
        
        // Clamp
        if (def.role === 'ANCHOR' || def.role === 'SUPPORT') {
             if (candidate.y < -1.0) candidate.y = -1.0;
             if (candidate.y > 0.0) candidate.y = 0.0;
        } else {
             if (candidate.y < -1.5) candidate.y = -1.5;
             if (candidate.y > 0.5) candidate.y = 0.5;
        }

        // --- Z AXIS (Depth Stacking) ---
        let zBase = 0;
        let zVar = 0.5; 
        switch (def.role) {
            case 'ANCHOR': zBase = -2.5; zVar = 0.5; break;
            case 'SUPPORT': zBase = -1.0; zVar = 0.8; break;
            case 'ACCENT': zBase = 0.5; zVar = 1.0; break;
            case 'MICRO': zBase = 2.0; zVar = 1.2; break;
        }
        candidate.z = zBase + (Math.random() - 0.5) * zVar;

        // --- KOLIZJA (Separacja 2D) ---
        let sepFactor = 1.1;
        if (def.role === 'MICRO') sepFactor = 1.05;
        if (def.role === 'ANCHOR') sepFactor = 1.15;

        if (!checkSeparation(candidate, def.scale / 2, bubbles, sepFactor)) {
           bestPos = candidate;
           found = true;
           break;
        }
      }

      if (!found) bestPos = new THREE.Vector3((Math.random()-0.5)*12, -15, 0);

      // --- STYL ---
      let distortF = 0.0;
      if (def.role === 'ANCHOR') distortF = 0.02; 

      bubbles.push({
        id: i,
        palette: finalPalette,
        position: [bestPos.x, bestPos.y, bestPos.z],
        scale: def.scale,
        speed: 0.2, 
        distortSpeed: 0.1, 
        distortFactor: distortF,
        rotationOffset: [Math.random()*Math.PI, Math.random()*Math.PI, 0],
        stiffness: 1.0, 
        role: def.role
      });
    });

    return bubbles;
  }

  return generateOldLayouts(count, composition, globalTheme);
};

const generateOldLayouts = (count: number, composition: CompositionType, theme: any[]) => {
    const bubbles: BubbleData[] = [];
    // W trybie STUDIO (Organic) i BORDER (Backdrop) trzymamy stałą liczbę dla lepszej kontroli
    const actualCount = (composition === 'STUDIO' || composition === 'BORDER') ? 20 : count;

    for (let i = 0; i < actualCount; i++) {
        const rawPalette = theme[Math.floor(Math.random() * theme.length)];
        let pos: [number, number, number] = [0, 0, 0];
        let scale = 1;
        let role = 'LEGACY';
        
        // CZY TO JEST NASZ GŁÓWNY BOHATER? (Pierwszy obiekt)
        const isHero = i === 0;

        // 1. Logika Pozycji i Skali
        if (composition === 'BORDER') {
            // --- BACKDROP (Tło za produktem) ---
            if (isHero) {
                // WIELKI PLACEHOLDER W TLE
                // Ustawiamy go głęboko (-6.0) i centralnie
                pos = [
                    (Math.random() - 0.5) * 2.0, // Lekki luz X
                    (Math.random() - 0.5) * 1.0, // Lekki luz Y
                    -6.0 // Głęboko w tle
                ];
                scale = 4.0; // Bardzo duży (robi za tło)
                role = 'HERO_PLACEHOLDER';
            } else {
                // Reszta to "dekoracja" dookoła
                const z = -2.5 - Math.random() * 5.0;
                // Im głębiej, tym szerzej
                const x = (Math.random() - 0.5) * (14 + Math.abs(z)*0.5); 
                const y = (Math.random() - 0.5) * 8.0;
                pos = [x, y, z];
                scale = 0.5 + Math.random() * 2.0;
            }
        } 
        else if (composition === 'STUDIO') {
            // --- ORGANIC (Luźna kompozycja na podłodze) ---
            if (isHero) {
                // GŁÓWNY OBIEKT NA PODŁODZE
                pos = [
                    (Math.random() - 0.5) * 1.0, // Prawie środek X
                    -0.5, // Leży na podłodze
                    (Math.random() - 0.5) * 1.0  // Prawie środek Z
                ];
                scale = 2.5; // Dominujący
                role = 'HERO_PLACEHOLDER';
            } else {
                // Reszta rozsypana dookoła Hero
                let bestPos = new THREE.Vector3();
                let found = false;
                for(let k=0; k<50; k++) {
                     bestPos.set(
                        (Math.random()-0.5) * 9.0, 
                        -1.5 + Math.random() * 2.5, 
                        (Math.random()-0.5) * 5.0
                     );
                     // Unikamy kolizji (dla Hero dajemy większy margines 0.6)
                     if(!checkCollisionOld(bestPos, 0.6, bubbles as any)) { 
                        found = true; break; 
                     }
                }
                if(!found) bestPos.set((Math.random()-0.5)*10, -10, 0);
                pos = [bestPos.x, bestPos.y, bestPos.z];
                scale = 0.6 + Math.random() * 0.9; // Mniejsze
            }
        }
        else { 
            // CHAOS / STAGE (Fallback)
            pos = [(Math.random()-0.5)*14, (Math.random()-0.5)*9, (Math.random()-0.5)*8];
            scale = 0.5 + Math.random() * 1.5;
        }
        
        // 2. Koloryzacja (Color Weighting)
        let finalPalette = { ...rawPalette };
        
        // Hero zawsze dostaje kolor bazowy (Ciemny/Solidny)
        if (isHero || scale > 1.5) {
            finalPalette.mid = rawPalette.base;
            finalPalette.base = rawPalette.base;
        } else {
            // Drobnica jaśniejsza
            finalPalette.mid = Math.random() > 0.5 ? rawPalette.rim : rawPalette.mid;
        }

        bubbles.push({
            id: i, 
            palette: finalPalette, 
            position: pos, 
            scale: scale, 
            speed: isHero ? 0.2 : 1.0, // Hero rusza się wolniej
            distortSpeed: isHero ? 0.1 : 1.0, 
            distortFactor: isHero ? 0.05 : 0.3, // Hero jest sztywniejszy
            rotationOffset: [Math.random() * Math.PI, Math.random() * Math.PI, 0], 
            stiffness: isHero ? 0.9 : 0.5, 
            role: role
        });
    }
    return bubbles;
}