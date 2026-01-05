import * as THREE from 'three';
import { PALETTES } from '../config/tokens';
import type { PaletteKey } from '../config/tokens';
import { BRAND_SIGNETS } from '../config/assets';

export type CompositionType = 'CHAOS' | 'STAGE' | 'BORDER' | 'STUDIO' | 'STUDIO_SCENOGRAPHY';

export interface BubbleData {
  id: number;
  palette: { base: string; mid: string; rim: string };
  position: [number, number, number];
  scale: number;
  movement: { speed: number; floatIntensity: number; rotationIntensity: number; };
  distortSpeed: number; distortFactor: number; rotationOffset: [number, number, number];
  role: string;
  imageUrl?: string | null;
  modelPath?: string | null;
}

const PHI = 1.61803398875;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); 
const IMAGE_PATH = 'public/textures/image-placeholder.jpg';

// SKALE
const S_MICRO   = 0.5;
const S_ACCENT  = S_MICRO * PHI;    
const S_SUPPORT = S_ACCENT * PHI;   
const S_ANCHOR  = S_SUPPORT * 1.2;  

const getRandomPalette = (theme: any[]) => theme[Math.floor(Math.random() * theme.length)];

const checkSeparation2D = (candidatePos: THREE.Vector3, radius: number, existingBubbles: BubbleData[], minFactor: number = PHI) => {
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
  const signetPath = BRAND_SIGNETS[mode];

// =========================================================
  // 1. SCENA (SCENOGRAPHY) - ZAGĘSZCZONA (WIĘCEJ ELEMENTÓW)
  // =========================================================
  if (composition === 'STUDIO_SCENOGRAPHY') {
    const definitions = [
      // GŁÓWNY
      { role: signetPath ? 'SIGNET' : 'ANCHOR',  scale: S_ANCHOR },  
      
      // SUPPORTY (Więcej: 3 sztuki)
      { role: 'SUPPORT', scale: S_SUPPORT }, 
      { role: 'SUPPORT', scale: S_SUPPORT }, 
      { role: 'SUPPORT', scale: S_SUPPORT },

      // AKCENTY (Więcej: 6 sztuk)
      { role: 'ACCENT',  scale: S_ACCENT }, { role: 'ACCENT',  scale: S_ACCENT }, 
      { role: 'ACCENT',  scale: S_ACCENT }, { role: 'ACCENT',  scale: S_ACCENT },
      { role: 'ACCENT',  scale: S_ACCENT }, { role: 'ACCENT',  scale: S_ACCENT },

      // MICRO (Dużo: 9 sztuk, wypełniacze)
      { role: 'MICRO',   scale: S_MICRO }, { role: 'MICRO',   scale: S_MICRO }, { role: 'MICRO',   scale: S_MICRO },
      { role: 'MICRO',   scale: S_MICRO }, { role: 'MICRO',   scale: S_MICRO }, { role: 'MICRO',   scale: S_MICRO },
      { role: 'MICRO',   scale: S_MICRO }, { role: 'MICRO',   scale: S_MICRO }, { role: 'MICRO',   scale: S_MICRO },
    ];

    definitions.forEach((def, i) => {
      const rawPalette = getRandomPalette(globalTheme);
      let finalPalette = { ...rawPalette };

      if (def.role === 'ANCHOR' || def.role === 'SIGNET' || def.role === 'SUPPORT') {
        finalPalette.mid = rawPalette.base; finalPalette.base = rawPalette.base; finalPalette.rim = rawPalette.mid;   
      } else {
        finalPalette.mid = rawPalette.mid; finalPalette.base = rawPalette.base; finalPalette.rim = rawPalette.rim;     
      }

      let bestPos = new THREE.Vector3(0, -100, 0);
      let found = false;

      for (let attempt = 0; attempt < 400; attempt++) {
        const candidate = new THREE.Vector3();

        if (def.role === 'ANCHOR' || def.role === 'SIGNET') {
           candidate.x = (Math.random() - 0.5) * 0.5; candidate.y = 0; candidate.z = -1.0;
        } 
        else if (def.role === 'SUPPORT') {
           const side = Math.random() > 0.5 ? 1 : -1;
           // Troszkę bliżej, bo jest ich więcej
           candidate.x = side * (S_ANCHOR + 0.5 + Math.random() * 2.0);
           candidate.y = (Math.random() - 0.5) * 1.5; 
           candidate.z = -1.5 + Math.random();
        } 
        else {
           // Wzór spirali
           // FIX: radius rośnie wolniej (i * 0.3), żeby pomieścić więcej elementów w kadrze
           const radius = (S_SUPPORT * 1.2) + (i * 0.3) + (Math.random() * 1.5);
           const angle = i * GOLDEN_ANGLE; 
           
           candidate.x = Math.cos(angle) * radius * 1.4; // Szerokość
           candidate.y = Math.sin(angle) * radius * 0.6; // Wysokość (spłaszczona)
           candidate.z = -2.0 - (Math.random() * 3.0);
        }

        const gapFactor = (def.role === 'MICRO') ? 1.1 : 1.3;
        if (!checkSeparation2D(candidate, def.scale / 2, bubbles, gapFactor)) { bestPos = candidate; found = true; break; }
      }
      
      if (!found) bestPos.set((Math.random()-0.5)*14, (Math.random()-0.5)*6, -6);

      const isSignet = def.role === 'SIGNET';
      bubbles.push({
        id: i, palette: finalPalette, position: [bestPos.x, bestPos.y, bestPos.z], scale: def.scale,
        movement: {
          speed: 0.3,
          floatIntensity: isSignet ? 0.5 : 0.4, 
          rotationIntensity: isSignet ? 0.1 : 0.2
        },
        distortSpeed: 0.2, distortFactor: def.role==='ANCHOR' ? 0.05 : 0.2, rotationOffset: [Math.random()*3, Math.random()*3, 0],
        role: def.role, modelPath: def.role === 'SIGNET' ? signetPath : null
      });
    });
  }
  // =========================================================
  // 2. RAMA (BORDER)
  // =========================================================
  else if (composition === 'BORDER') {
     const actualCount = 20;
     for (let i = 0; i < actualCount; i++) {
        const rawPalette = getRandomPalette(globalTheme);
        const isHero = i === 0;
        let pos: [number, number, number];
        let scale = 1;
        if (isHero) { pos = [0, 0, -6.0]; scale = 4.0; } 
        else {
            const z = -2.5 - Math.random() * (4.0 * PHI); 
            const spreadX = 8.0 * PHI; 
            const x = (Math.random() - 0.5) * spreadX * (1 + Math.abs(z)/10);
            const y = (Math.random() - 0.5) * (spreadX / PHI); 
            pos = [x, y, z]; scale = 0.2 + Math.random() * 0.6; 
        }
        bubbles.push({
            id: i, palette: rawPalette, position: pos, scale: scale,
            movement: { speed: isHero ? 0.5 : 0.8, floatIntensity: isHero ? 0.3 : 0.5, rotationIntensity: 0.4 },
            distortSpeed: 1.0, distortFactor: isHero ? 0.1 : 0.4, rotationOffset: [0,0,0], role: isHero ? 'HERO' : 'DECO', imageUrl: isHero ? IMAGE_PATH : null
        });
    }
  }

  // =========================================================
  // 3. MOLEKUŁA (STUDIO) - OBNIŻONA
  // =========================================================
  else if (composition === 'STUDIO') {
    const actualCount = 20;
    
    // FIX: Przesunięcie w dół (Offset Y)
    const OFFSET_Y = -1.0; 

    // 1. SYGNET (Hero) - Obniżony
    if (signetPath) {
        bubbles.push({
            id: 0, 
            palette: PALETTES[mode][0], 
            position: [0, OFFSET_Y, 0], // Zmiana Y na -1.0
            scale: 2.2,                
            movement: { speed: 0.5, floatIntensity: 0.8, rotationIntensity: 0.1 },
            distortSpeed: 0, distortFactor: 0, rotationOffset: [0,0,0], 
            role: 'SIGNET', modelPath: signetPath
        });
    }

    // 2. TŁO - Obniżone
    const startIdx = signetPath ? 1 : 0;
    for (let i = startIdx; i < actualCount; i++) {
        const rawPalette = getRandomPalette(globalTheme);
        
        let pos: [number, number, number];
        let attempts = 0;
        do {
            const z = -4.0 - Math.random() * 6.0;
            const width = 12.0 + Math.abs(z); 
            const height = 8.0 + Math.abs(z) * 0.5;
            
            const x = (Math.random() - 0.5) * width;
            // FIX: Y generujemy wokół OFFSET_Y
            const y = OFFSET_Y + (Math.random() - 0.5) * height; 
            
            pos = [x, y, z];
            attempts++;
        } while (
            attempts < 10 && pos[2] > -5 && Math.abs(pos[0]) < 2.0 && Math.abs(pos[1] - OFFSET_Y) < 2.0
        );

        bubbles.push({
            id: i, palette: rawPalette, position: pos, 
            scale: 0.5 + Math.random() * 1.5,
            movement: { speed: 0.5 + Math.random() * 0.5, floatIntensity: 1.0, rotationIntensity: 0.5 },
            distortSpeed: 0.5, distortFactor: 0.3,
            rotationOffset: [Math.random(), Math.random(), 0], role: 'DECO'
        });
    }
  }

  // =========================================================
  // 4. CHAOS (Sygnet w tle na Z=-5)
  // =========================================================
  else {
      for (let i = 0; i < count; i++) {
        const rawPalette = getRandomPalette(globalTheme);
        const isSignet = i === 0 && !!signetPath;
        let pos: [number, number, number];
        let scale: number;
        let movementSpeed: number;
        if (isSignet) {
            // Sygnet w tle: Z = -5.0
            pos = [(Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 1.0, -5.0];
            scale = 2.5; movementSpeed = 0.5;
        } else {
            pos = [(Math.random()-0.5)*14, (Math.random()-0.5)*9, (Math.random()-0.5)*8];
            scale = 0.5 + Math.random() * 1.5; movementSpeed = 1.0 + Math.random();
        }
        bubbles.push({
            id: i, palette: rawPalette, position: pos, scale: scale,
            movement: { speed: movementSpeed, floatIntensity: isSignet ? 0.5 : 1.0 + Math.random() * 0.5, rotationIntensity: 1.0 },
            distortSpeed: 1.0, distortFactor: 0.4, rotationOffset: [Math.random(), Math.random(), 0], role: isSignet ? 'SIGNET' : 'CHAOS', modelPath: isSignet ? signetPath : null
        });
    }
  }

  return bubbles;
};