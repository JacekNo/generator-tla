export type PaletteKey = 'TECHNIKUM' | 'LICEUM' | 'PLASTYCZNE' | 'DOMOWA' | 'MIX';

export const PALETTES: Record<PaletteKey, { base: string; mid: string; rim: string }[]> = {
  
  // TM - Technikum (#C51523 -> #FF545E)
  TECHNIKUM: [
    { base: '#C51523', mid: '#FF545E', rim: '#FF545E' }
  ],

  // LO - Liceum (#0085B7 -> #40B6FF)
  LICEUM: [
    { base: '#0085B7', mid: '#40B6FF', rim: '#40B6FF' }
  ],

  // LP - Plastyczne (#A43282 -> #DD48B1)
  PLASTYCZNE: [
    { base: '#A43282', mid: '#DD48B1', rim: '#DD48B1' }
  ],

  // ED - Edukacja Domowa (#0941A1 -> #1E53E5)
  DOMOWA: [
    { base: '#0941A1', mid: '#1E53E5', rim: '#1E53E5' }
  ],

  // MIX - Losuje z powyższych
  MIX: [
    { base: '#C51523', mid: '#FF545E', rim: '#FF545E' }, // TM
    { base: '#0085B7', mid: '#40B6FF', rim: '#40B6FF' }, // LO
    { base: '#A43282', mid: '#DD48B1', rim: '#DD48B1' }, // LP
    { base: '#0941A1', mid: '#1E53E5', rim: '#1E53E5' }  // ED
  ]
};