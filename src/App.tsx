import { useState, useRef } from 'react';
import { Scene } from './components/Scene';
import type { BackgroundStyle, BubbleStyle } from './components/Scene';
import type { CompositionType } from './logic/LayoutEngine';
import type { PaletteKey } from './config/tokens';

// --- DANE KONFIGURACYJNE ---
const MODES: PaletteKey[] = ['MIX', 'TECHNIKUM', 'LICEUM', 'PLASTYCZNE', 'DOMOWA'];

const COMPOSITIONS: { id: CompositionType; label: string }[] = [
  { id: 'CHAOS', label: 'Chmura' },
  { id: 'STUDIO_SCENOGRAPHY', label: 'Scena' },
  { id: 'BORDER', label: 'Rama' },
  { id: 'STUDIO', label: 'Molekuła' },
];

const STYLES: { id: BubbleStyle; label: string }[] = [
  { id: 'MATTE', label: 'Bańka' },
  { id: 'CLAY', label: 'Bąbel' },
  { id: 'VIVID', label: 'Glutek' },
];

// --- HELPER STYLÓW ---
// Funkcja generująca style dla szklanych przycisków
const getGlassBtnStyle = (isActive: boolean, overrides: React.CSSProperties = {}) => ({
  background: isActive ? '#1a1a1a' : 'rgba(255, 255, 255, 0.75)',
  color: isActive ? '#fff' : '#1a1a1a',
  border: isActive ? '1px solid #1a1a1a' : '1px solid rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  padding: '10px 20px',
  borderRadius: '40px', // Bardziej zaokrąglone
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.8rem',
  fontWeight: 600,
  transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  boxShadow: isActive 
    ? '0 6px 16px rgba(0,0,0,0.2)' 
    : '0 2px 8px rgba(0,0,0,0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  ...overrides,
});

// Główne style kontenerów
const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative' as const,
    overflow: 'hidden',
    background: '#f2f4f6',
  },
  // Panel Lewy Góra (Tryby i Materiały)
  uiTopLeft: {
    position: 'absolute' as const,
    top: 30,
    left: 30,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  // Panel Prawy Góra (Aura, Układy, Export)
  uiTopRight: {
    position: 'absolute' as const,
    top: 30,
    right: 30,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '20px',
  },
  // Panel Dolny Środek (Losowanie)
  uiBottomCenter: {
    position: 'absolute' as const,
    bottom: 50,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
  },
  // Stopka
  footer: {
    position: 'absolute' as const,
    bottom: 12,
    width: '100%',
    textAlign: 'center' as const,
    color: '#666',
    fontFamily: 'Inter, sans-serif',
    fontSize: '10px',
    fontWeight: 500,
    opacity: 0.7,
    letterSpacing: '0.5px',
    pointerEvents: 'none' as const,
  },
  sectionLabel: {
    fontSize: '0.65rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '1.5px',
    color: '#555',
    marginBottom: '8px',
    fontWeight: 800,
    marginLeft: '4px',
  },
  row: {
    display: 'flex',
    gap: '8px',
  },
  columnEnd: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    alignItems: 'flex-end',
  },
  exportBtn: {
    background: '#E30613', // TEB Red
    color: 'white',
    border: 'none',
    padding: '12px 32px',
    borderRadius: '40px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    boxShadow: '0 8px 24px rgba(227, 6, 19, 0.3)',
    transition: 'transform 0.2s',
  }
};

function App() {
  const [mode, setMode] = useState<PaletteKey>('MIX');
  const [layout, setLayout] = useState<CompositionType>('STUDIO_SCENOGRAPHY');
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('CLEAN');
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>('CLAY');
  const [seed, setSeed] = useState(0);

  const sceneRef = useRef<any>(null);

  const handleDownload = () => {
    if (sceneRef.current) sceneRef.current.capture();
  };

  const handleShuffle = () => {
    setSeed(Math.random());
  };

  return (
    <div style={styles.container}>
      
      {/* --- SCENA 3D --- */}
      <Scene 
        ref={sceneRef}
        mode={mode}
        composition={layout}
        bgStyle={bgStyle}
        bubbleStyle={bubbleStyle}
        count={25}
        seed={seed}
      />

      {/* --- PANEL LEWY: KONFIGURACJA BRANDU --- */}
      <div style={styles.uiTopLeft}>
        {/* Brand */}
        <div>
          <div style={styles.sectionLabel}>Brand Mode</div>
          <div style={styles.row}>
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={getGlassBtnStyle(mode === m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Material */}
        <div>
           <div style={styles.sectionLabel}>Material Style</div>
           <div style={styles.row}>
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setBubbleStyle(s.id)}
                style={getGlassBtnStyle(bubbleStyle === s.id)}
              >
                {s.label}
              </button>
            ))}
           </div>
        </div>
      </div>

      {/* --- PANEL PRAWY: KOMPOZYCJA I AKCJE --- */}
      <div style={styles.uiTopRight}>
        
        {/* DUŻY PRZEŁĄCZNIK TŁA */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ ...styles.sectionLabel, textAlign: 'right' }}>Background</div>
          <button 
             onClick={() => setBgStyle(bgStyle === 'CLEAN' ? 'MISTY' : 'CLEAN')}
             // Specjalny styl dla przycisku Aury
             style={getGlassBtnStyle(bgStyle === 'MISTY', { 
               width: '180px', 
               justifyContent: 'space-between',
               background: bgStyle === 'MISTY' ? '#E30613' : 'rgba(255,255,255,0.7)', // Czerwony jak aktywny
               color: bgStyle === 'MISTY' ? '#fff' : '#333',
               border: 'none'
             })}
           >
             <span>Aura Effect</span>
             <span>{bgStyle === 'MISTY' ? 'ON' : 'OFF'}</span>
           </button>
        </div>

        {/* Wybór Layoutu */}
        <div>
          <div style={{ ...styles.sectionLabel, textAlign: 'right' }}>Composition</div>
          <div style={styles.columnEnd}>
            {COMPOSITIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => setLayout(c.id)}
                style={getGlassBtnStyle(layout === c.id, { width: '180px', justifyContent: 'flex-end' })}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={handleDownload}
            style={styles.exportBtn}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            Zapisz Obraz 4K
          </button>
        </div>
      </div>

      {/* --- CENTRUM DÓŁ: WIELKI PRZYCISK SHUFFLE --- */}
      <div style={styles.uiBottomCenter}>
        <button 
          onClick={handleShuffle}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1.0)'}
          style={getGlassBtnStyle(false, { 
            fontSize: '1rem', 
            padding: '16px 48px',
            background: '#ffffff', // Czysta biel dla kontrastu
            color: '#111',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            border: 'none',
            fontWeight: 800,
            letterSpacing: '0.5px'
          })}
        >
          <span style={{ fontSize: '1.4rem' }}>🎲</span>
          <span>LOSUJ KOMPOZYCJĘ</span>
        </button>
      </div>

      {/* --- STOPKA (FOOTER) --- */}
      <div style={styles.footer}>
        GENERATED BY PAW SYSTEM • SZKOŁY ŚREDNIE - TEB EDUKACJA
      </div>

    </div>
  );
}

export default App;