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

// Funkcja pomocnicza: Tasowanie
const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Standardowa kolizja dla starych trybów
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

// NOWA KOLIZJA: Wymusza odstęp (graphic-first)
const checkSeparation = (
  candidatePos: THREE.Vector3, 
  radius: number, 
  existingBubbles: { position: [number, number, number], scale: number }[],
  minFactor: number = 1.1 // Domyślnie 110% sumy promieni (NIC SIĘ NIE DOTYKA)
) => {
  for (let b of existingBubbles) {
    const dist = candidatePos.distanceTo(new THREE.Vector3(...b.position));
    // Dystans musi być WIĘKSZY niż suma promieni * factor
    const requiredDist = (radius + b.scale / 2) * minFactor;
    if (dist < requiredDist) return true; // Za blisko!
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
  // TRYB: STUDIO_SCENOGRAPHY (Graphic-First)
  // =========================================================
  if (composition === 'STUDIO_SCENOGRAPHY') {
    
    // 1. STRUKTURA RÓL (Sztywna i czysta)
    const definitions = [
      { role: 'ANCHOR',  scale: 2.8 }, // Hero
      { role: 'SUPPORT', scale: 1.6 }, // Duże wsparcie
      { role: 'SUPPORT', scale: 1.5 },
      { role: 'ACCENT',  scale: 0.9 }, // Rytm
      { role: 'ACCENT',  scale: 0.8 },
      { role: 'ACCENT',  scale: 0.7 },
      { role: 'ACCENT',  scale: 0.6 },
    ];

    // Anchor position reference
    let anchorX = 0;

    definitions.forEach((def, i) => {
      // 2. KOLOR = HIERARCHIA
      const rawPalette = globalTheme[Math.floor(Math.random() * globalTheme.length)];
      let finalPalette = { ...rawPalette };

      if (def.role === 'ANCHOR' || def.role === 'SUPPORT') {
        // Główne bryły w kolorze marki (mid)
        // Trick: ustawiamy mid jako dominujący, reszta neutralna
        finalPalette.base = rawPalette.mid; 
      } else {
        // Accents: Zmieniamy jasność (używając rim/base z palety jako proxy)
        const variant = Math.random();
        if (variant > 0.5) finalPalette.mid = rawPalette.rim; // Jaśniejszy
        else finalPalette.mid = rawPalette.base; // Ciemniejszy
      }

      // 3. OŚ I POZYCJONOWANIE
      let bestPos = new THREE.Vector3(0, -100, 0);
      let found = false;
      const attempts = 300;

      for (let attempt = 0; attempt < attempts; attempt++) {
        const candidate = new THREE.Vector3();

        // OŚ X (Rozkład)
        if (def.role === 'ANCHOR') {
           // Anchor blisko środka, ale z offsetem (asymetria)
           const offsetX = (Math.random() - 0.5) * 2.0; 
           candidate.x = offsetX;
           anchorX = offsetX; // Zapisz dla innych
        } else if (def.role === 'SUPPORT') {
           // Supporty szeroko, balansują Anchora
           const side = Math.random() > 0.5 ? 1 : -1;
           // Odsuwamy od Anchora na 2.5 - 5.0 jednostek
           candidate.x = anchorX + (side * (2.5 + Math.random() * 2.5));
        } else {
           // Accents wypełniają luki (Rytm)
           // Losujemy w całym pasie roboczym (-6 do 6)
           candidate.x = (Math.random() - 0.5) * 12.0;
        }

        // OŚ Y (Wąski pas horyzontalny - ZASADA 1)
        // Zakres: -1.2 do 0.4
        // Większe obiekty niżej, mniejsze mogą być wyżej (ale bez przesady)
        const yBase = -0.8; 
        const yVar = (Math.random() - 0.5) * 1.0; 
        candidate.y = yBase + yVar;
        // Hard clamp - wymuszenie pasa
        if (candidate.y < -1.2) candidate.y = -1.2;
        if (candidate.y > 0.4) candidate.y = 0.4;

        // OŚ Z (Płytka głębia - ZASADA 6)
        // Kartonowe plany, separacja
        candidate.z = (Math.random() - 0.5) * 1.5;

        // 4. SEPARACJA (ZASADA 2 - NIC SIĘ NIE DOTYKA)
        // Losujemy wymagany dystans dla tej próby (Near vs Mid)
        // Near (1.1 - 1.4), Mid (1.5 - 2.2)
        const separationFactor = 1.1 + Math.random() * 0.4; 
        
        if (!checkSeparation(candidate, def.scale / 2, bubbles, separationFactor)) {
           bestPos = candidate;
           found = true;
           break;
        }
      }

      if (!found) bestPos = new THREE.Vector3((Math.random()-0.5)*10, -10, 0);

      // 5. DEFORMACJA (ZASADA 3 - PRAWIE ZERO)
      // Obiekty są sztywne, projektowe.
      let distortF = 0.0;
      if (def.role === 'ANCHOR') distortF = 0.03; // Minimalne życie
      else if (def.role === 'SUPPORT') distortF = 0.02;

      bubbles.push({
        id: i,
        palette: finalPalette,
        position: [bestPos.x, bestPos.y, bestPos.z],
        scale: def.scale,
        speed: 0.2, // Bardzo wolne ruchy
        distortSpeed: 0.1, 
        distortFactor: distortF,
        rotationOffset: [Math.random()*Math.PI, Math.random()*Math.PI, 0],
        stiffness: 1.0, // Max sztywność
        role: def.role
      });
    });

    return bubbles;
  }

  // --- STARE TRYBY (Chaos, Studio etc.) ---
  // (Skrócona wersja dla czytelności - wklej tu resztę poprzedniego kodu dla STUDIO/BORDER/CHAOS)
  return generateOldLayouts(count, composition, globalTheme);
};

// Pomocnicza funkcja ze starą logiką (żeby nie kasować tego co działało)
const generateOldLayouts = (count: number, composition: any, theme: any[]) => {
    const bubbles: BubbleData[] = [];
    // ... Tu wklej starą logikę z poprzedniego kroku dla STUDIO/BORDER/CHAOS ...
    // Jeśli nie chcesz wklejać, mogę podać pełny plik w następnym kroku.
    // DLA UPROSZCZENIA TERAZ: Zwracam pustą tablicę jeśli to nie SCENOGRAPHY
    // (W realnym kodzie zostaw starą logikę w bloku `else`)
    
    // --- (Tu powinna być pętla ze starego LayoutEngine) ---
    // Aby kod działał od razu, dodam tu szybki fallback dla Chaosu:
    for (let i = 0; i < count; i++) {
        const colorSet = theme[Math.floor(Math.random() * theme.length)];
        bubbles.push({
            id: i, palette: colorSet, position: [(Math.random()-0.5)*10, (Math.random()-0.5)*6, -2],
            scale: 1, speed: 1, distortSpeed: 1, distortFactor: 0.3, rotationOffset: [0,0,0], stiffness: 0.5, role: 'LEGACY'
        });
    }
    return bubbles;
}