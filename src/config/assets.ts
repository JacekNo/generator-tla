import type { PaletteKey } from './tokens';

// Mapowanie: Nazwa Trybu -> Ścieżka do pliku GLB w folderze public/models
export const BRAND_SIGNETS: Record<PaletteKey, string | null> = {
  'TECHNIKUM': 'public/models/sygnety_TEB-TECHNIKUM.glb', // Podmień na swoje nazwy plików
  'LICEUM': 'public/models/sygnety_TEB-LICEUM.glb',
  'PLASTYCZNE': 'public/models/sygnety_TEB-PLASTYCZNE.glb',
  'DOMOWA': 'public/models/sygnety_TEB-DOMOWA.glb',
  'MIX': 'public/models/sygnety_TEB-EDUKACJA.glb',
};