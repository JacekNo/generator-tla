export const PALETTES = {
  TECHNIKUM: [
    { base: '#5c0008', mid: '#b30000', rim: '#ff4d4d' },
    { base: '#8a0000', mid: '#E30613', rim: '#ff8a8a' }
  ],
  LICEUM: [
    { base: '#002845', mid: '#006699', rim: '#6acfff' },
    { base: '#004a70', mid: '#009FE3', rim: '#a3e2ff' }
  ],
  PLASTYCZNE: [
    // Wyliczone z A43282, DD48B1
    { base: '#701d55', mid: '#A43282', rim: '#DD48B1' }, 
    { base: '#A43282', mid: '#DD48B1', rim: '#FF85D5' }
  ],
  DOMOWA: [
    // Wyliczone z 0941A1, 1E53E5
    { base: '#002a70', mid: '#0941A1', rim: '#1E53E5' },
    { base: '#0941A1', mid: '#1E53E5', rim: '#6495ED' }
  ],
  MIX: [
    { base: '#8a0000', mid: '#E30613', rim: '#ff8a8a' }, // Technikum
    { base: '#004a70', mid: '#009FE3', rim: '#a3e2ff' }, // Liceum
    { base: '#A43282', mid: '#DD48B1', rim: '#FF85D5' }, // Plastyk
    { base: '#0941A1', mid: '#1E53E5', rim: '#6495ED' }  // Domowa
  ]
};

export type PaletteKey = keyof typeof PALETTES;