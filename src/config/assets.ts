// src/config/assets.ts

import type { PaletteKey } from './tokens';

// WAŻNE: Nie używamy 'public/' w ścieżkach.
// Ścieżki są relatywne do głównego pliku index.html po zbudowaniu.

export const BRAND_SIGNETS: Record<PaletteKey, string | null> = {
  // Jeśli masz inne nazwy plików, upewnij się, że są poprawne (wielkość liter ma znaczenie!)
  MIX: 'models/sygnety_TEB-EDUKACJA.glb', 
  TECHNIKUM: 'models/sygnety_TEB-TECHNIKUM.glb',
  LICEUM: 'models/sygnety_TEB-LICEUM.glb',
  PLASTYCZNE: 'models/sygnety_TEB-PLASTYCZNE.glb',
  DOMOWA: 'models/sygnety_TEB-DOMOWA.glb', // Zakładam nazwę pliku, sprawdź czy taką masz!
};