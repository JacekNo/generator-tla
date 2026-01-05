import { useState, useRef } from 'react';
import { Scene } from './components/Scene';
import type { BackgroundStyle, BubbleStyle, CompositionType } from './components/Scene';
import type { PaletteKey } from './config/tokens';

// --- TYPY POMOCNICZE ---
type SceneHandle = {
  capture: () => void;
};

// --- STYLES ---
const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  uiTopLeft: {
    position: 'absolute' as const,
    top: 40,
    left: 40,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  uiTopRight: {
    position: 'absolute' as const,
    top: 40,
    right: 40,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '24px',
  },
  uiBottomLeft: {
    position: 'absolute' as const,
    bottom: 40,
    left: 40,
    color: '#1a1a1a',
    fontFamily: 'Inter, Helvetica, Arial, sans-serif',
    pointerEvents: 'none' as const,
    opacity: 0.8,
    mixBlendMode: 'multiply' as const,
  },
  label: {
    fontSize: '0.65rem', // Troszkę mniejsze, bardziej eleganckie
    fontWeight: 700,
    color: '#888',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
    letterSpacing: '1.5px', // Szerszy spacing wygląda bardziej "pro"
    opacity: 0.8,
  },
  group: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginBottom: '28px',
  },
  row: {
    display: 'flex',
    gap: '8px',
  },
  title: {
    margin: 0,
    fontSize: '2.5rem',
    fontWeight: 800,
    letterSpacing: '-1px',
    lineHeight: '1.1',
  },
  meta: {
    marginTop: '10px',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    display: 'flex',
    gap: '20px',
    borderTop: '1px solid rgba(0,0,0,0.1)',
    paddingTop: '10px',
    width: 'fit-content',
    color: '#555'
  },
};

// Funkcja generująca styl przycisku
const getGlassBtnStyle = (active: boolean, extraStyles: React.CSSProperties = {}) => ({
  background: active ? '#1a1a1a' : 'rgba(255, 255, 255, 0.5)',
  color: active ? '#fff' : '#1a1a1a',
  border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.6)',
  padding: '10px 16px', // Nieco większy padding dla elegancji
  cursor: 'pointer',
  borderRadius: '40px', // Bardziej zaokrąglone
  fontWeight: 600,
  fontSize: '0.7rem',
  backdropFilter: 'blur(12px)',
  transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
  boxShadow: active ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
  minWidth: '60px',
  textAlign: 'center' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  ...extraStyles,
});

// --- DANE KONFIGURACYJNE ---
const MODES: PaletteKey[] = ['TECHNIKUM', 'LICEUM', 'PLASTYCZNE', 'DOMOWA', 'MIX'];

function App() {
  const [mode, setMode] = useState<PaletteKey>('MIX');
  // ZMIANA DEFAULTÓW:
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('CLEAN'); 
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>('CLAY'); // Startujemy od RESIN (Clay)
  const [composition, setComposition] = useState<CompositionType>('CHAOS');
  const [seed, setSeed] = useState(0);
  
  const sceneRef = useRef<SceneHandle>(null);

  const handleDownload = () => {
    if (sceneRef.current) sceneRef.current.capture();
  };

  const handleShuffle = () => {
    setSeed(Math.random());
  };

  // Mapowanie nazw technicznych na wizualne (UI Labels)
  const getMaterialLabel = (style: BubbleStyle) => {
    switch(style) {
      case 'CLAY': return 'Bąbel';  // Nowa nazwa dla Clay
      case 'VIVID': return 'Glutek'; // Nowa nazwa dla Vivid
      case 'MATTE': return 'Bańka';  // Nowa nazwa dla Matte (Bańki)
      default: return style;
    }
  };

  const getCompLabel = (comp: CompositionType) => {
    switch(comp) {
      case 'CHAOS': return 'Chaos';
      case 'STUDIO': return 'Molekuła';
      case 'STUDIO_SCENOGRAPHY': return 'Scena';
      case 'BORDER': return 'Rama';
      default: return comp;
    }
  };

  return (
    <div style={styles.container}>
      <Scene 
        ref={sceneRef} 
        mode={mode} 
        bgStyle={bgStyle} 
        bubbleStyle={bubbleStyle}
        composition={composition}
        seed={seed}
        count={20} 
      />
      
      {/* --- UI: LEWY GÓRNY RÓG --- */}
      <div style={styles.uiTopLeft}>
        
        {/* Grupa 1: MATERIAŁ (Najważniejsze, więc teraz na górze) */}
        <div style={styles.group}>
          <div style={styles.label}>Material</div>
          <div style={styles.row}>
            {/* ZMIENIONA KOLEJNOŚĆ: Najpierw Resin (Clay), potem Velvet (Vivid), na końcu Glass (Matte) */}
            <button onClick={() => setBubbleStyle('CLAY')} style={getGlassBtnStyle(bubbleStyle === 'CLAY')}>
              {getMaterialLabel('CLAY')}
            </button>
            <button onClick={() => setBubbleStyle('VIVID')} style={getGlassBtnStyle(bubbleStyle === 'VIVID')}>
              {getMaterialLabel('VIVID')}
            </button>
            <button onClick={() => setBubbleStyle('MATTE')} style={getGlassBtnStyle(bubbleStyle === 'MATTE')}>
              {getMaterialLabel('MATTE')}
            </button>
          </div>
        </div>

        {/* Grupa 2: UKŁAD */}
        <div style={styles.group}>
          <div style={styles.label}>Layout</div>
          <div style={styles.row}>
            <button onClick={() => setComposition('CHAOS')} style={getGlassBtnStyle(composition === 'CHAOS')}>
              {getCompLabel('CHAOS')}
            </button>
            <button onClick={() => setComposition('STUDIO')} style={getGlassBtnStyle(composition === 'STUDIO')}>
              {getCompLabel('STUDIO')}
            </button>
            <button onClick={() => setComposition('STUDIO_SCENOGRAPHY')} style={getGlassBtnStyle(composition === 'STUDIO_SCENOGRAPHY')}>
              {getCompLabel('STUDIO_SCENOGRAPHY')}
            </button>
            <button onClick={() => setComposition('BORDER')} style={getGlassBtnStyle(composition === 'BORDER')}>
              {getCompLabel('BORDER')}
            </button>
          </div>
        </div>

        {/* Grupa 3: TŁO */}
        <div style={styles.group}>
          <div style={styles.label}>Atmosphere</div>
          <div style={styles.row}>
            <button onClick={() => setBgStyle('CLEAN')} style={getGlassBtnStyle(bgStyle === 'CLEAN')}>
              Pure
            </button>
            <button onClick={() => setBgStyle('MISTY')} style={getGlassBtnStyle(bgStyle === 'MISTY')}>
              Aura
            </button>
          </div>
        </div>
      </div>

      {/* --- UI: PRAWY GÓRNY RÓG --- */}
      <div style={styles.uiTopRight}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={getGlassBtnStyle(mode === m, { minWidth: '120px', textAlign: 'right' })}
            >
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleShuffle}
            title="Randomize"
            style={getGlassBtnStyle(false, {
              minWidth: 'auto',
              background: 'rgba(255,255,255,0.8)',
              color: '#333',
              fontSize: '1.2rem',
              padding: '8px 14px',
            })}
          >
            🎲
          </button>

          <button
            onClick={handleDownload}
            style={{
              background: '#E30613',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '40px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 8px 24px rgba(227, 6, 19, 0.35)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            Export 4K
          </button>
        </div>
      </div>

      {/* --- UI: LEWY DOLNY RÓG --- */}
      <div style={styles.uiBottomLeft}>
        <h1 style={styles.title}>Brand Generator</h1>
        <div style={styles.meta}>
          <span>{mode}</span>
          <span>// {getCompLabel(composition)}</span>
          <span>// {getMaterialLabel(bubbleStyle)}</span>
        </div>
      </div>
    </div>
  );
}

export default App;