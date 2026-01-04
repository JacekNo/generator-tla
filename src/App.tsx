import { useState, useRef } from 'react';
import { Scene } from './components/Scene';
import type { BackgroundStyle, BubbleStyle, CompositionType } from './components/Scene';
import type { PaletteKey } from './config/tokens';

function App() {
  const [mode, setMode] = useState<PaletteKey>('MIX');
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('CLEAN');
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>('MATTE');
  const [composition, setComposition] = useState<CompositionType>('CHAOS');
  const [seed, setSeed] = useState(0);
  
  // @ts-ignore
  const sceneRef = useRef<any>(null);

  const handleDownload = () => {
    if (sceneRef.current) sceneRef.current.capture();
  };

  const handleShuffle = () => {
    setSeed(Math.random());
  };

  const glassBtn = (active: boolean) => ({
    background: active ? '#1a1a1a' : 'rgba(255, 255, 255, 0.4)',
    color: active ? '#fff' : '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '8px 10px',
    cursor: 'pointer',
    borderRadius: '30px',
    fontWeight: 600,
    fontSize: '0.65rem',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    boxShadow: active ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
    minWidth: '50px',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  });

  const labelStyle = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#666',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
    letterSpacing: '1px',
    opacity: 0.7
  };

  const groupStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    marginBottom: '24px'
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Scene 
        ref={sceneRef} 
        mode={mode} 
        bgStyle={bgStyle} 
        bubbleStyle={bubbleStyle}
        composition={composition}
        seed={seed}
        count={20} 
      />
      
      {/* LEWY GÓRNY RÓG */}
      <div style={{
        position: 'absolute',
        top: 40,
        left: 40,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Grupa: Kompozycja */}
        <div style={groupStyle}>
          <div style={labelStyle}>Kompozycja</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setComposition('CHAOS')} style={glassBtn(composition === 'CHAOS')}>
              Chaos
            </button>
            <button onClick={() => setComposition('STUDIO')} style={glassBtn(composition === 'STUDIO')}>
              Organic
            </button>
            {/* NOWY PRZYCISK */}
            <button onClick={() => setComposition('STUDIO_SCENOGRAPHY')} style={glassBtn(composition === 'STUDIO_SCENOGRAPHY')}>
              Sceno
            </button>
            <button onClick={() => setComposition('BORDER')} style={glassBtn(composition === 'BORDER')}>
              Backdrop
            </button>
          </div>
        </div>

        {/* Grupa: Atmosfera */}
        <div style={groupStyle}>
          <div style={labelStyle}>Atmosfera</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setBgStyle('CLEAN')} style={glassBtn(bgStyle === 'CLEAN')}>
              Clean
            </button>
            <button onClick={() => setBgStyle('MISTY')} style={glassBtn(bgStyle === 'MISTY')}>
              Misty
            </button>
          </div>
        </div>

        {/* Grupa: Bąble */}
        <div style={groupStyle}>
          <div style={labelStyle}>Materiał</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setBubbleStyle('MATTE')} style={glassBtn(bubbleStyle === 'MATTE')}>
              Matte
            </button>
            <button onClick={() => setBubbleStyle('VIVID')} style={glassBtn(bubbleStyle === 'VIVID')}>
              Vivid
            </button>
            <button onClick={() => setBubbleStyle('CLAY')} style={glassBtn(bubbleStyle === 'CLAY')}>
              Clay
            </button>
          </div>
        </div>
      </div>

      {/* PRAWY GÓRNY RÓG */}
      <div style={{
        position: 'absolute',
        top: 40,
        right: 40,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {(['TECHNIKUM', 'LICEUM', 'PLASTYCZNE', 'DOMOWA', 'MIX'] as PaletteKey[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{ ...glassBtn(mode === m), minWidth: '120px', textAlign: 'right' }}
            >
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleShuffle}
            style={{
              ...glassBtn(false),
              minWidth: 'auto',
              background: 'rgba(255,255,255,0.8)',
              color: '#333',
              fontSize: '1.2rem',
              padding: '8px 14px',
            }}
            title="Losuj nowy układ"
          >
            🎲
          </button>

          <button
            onClick={handleDownload}
            style={{
              background: '#E30613',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 8px 20px rgba(227, 6, 19, 0.4)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            Pobierz 4K
          </button>
        </div>
      </div>

      {/* LEWY DOLNY RÓG */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 40,
        color: '#1a1a1a',
        fontFamily: 'Inter, Helvetica, Arial, sans-serif',
        pointerEvents: 'none',
        opacity: 0.8,
        mixBlendMode: 'multiply'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.5rem', 
          fontWeight: 800, 
          letterSpacing: '-1px',
          lineHeight: '1.1'
        }}>
          Generator Tła
        </h1>
        <div style={{ 
          marginTop: '10px', 
          fontSize: '0.8rem', 
          fontFamily: 'monospace', 
          textTransform: 'uppercase', 
          letterSpacing: '1px',
          display: 'flex',
          gap: '20px',
          borderTop: '1px solid rgba(0,0,0,0.2)',
          paddingTop: '10px',
          width: 'fit-content'
        }}>
          <span>MODE: <strong>{mode}</strong></span>
          <span>COMP: <strong>{composition}</strong></span>
          <span>STYLE: <strong>{bubbleStyle}</strong></span>
        </div>
      </div>
    </div>
  );
}

export default App;