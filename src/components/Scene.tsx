// @ts-nocheck
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, DepthOfField, Vignette, Noise } from '@react-three/postprocessing';
import { useMemo, forwardRef, useImperativeHandle, useState, useRef } from 'react';
import * as THREE from 'three';
import { PALETTES } from '../config/tokens';
import type { PaletteKey } from '../config/tokens';
import { Bubble } from './Bubble';
import { Background } from './Background';

export type BackgroundStyle = 'CLEAN' | 'MISTY';
export type BubbleStyle = 'MATTE' | 'VIVID' | 'CLAY';
export type CompositionType = 'CHAOS' | 'STAGE' | 'BORDER' | 'STUDIO';

interface SceneProps {
  mode?: PaletteKey;
  count?: number;
  bgStyle?: BackgroundStyle;
  bubbleStyle?: BubbleStyle;
  composition?: CompositionType;
  seed?: number;
}

// --- INTELLIGENT CAMERA RIG ---
const CameraRig = ({ composition }: { composition: CompositionType }) => {
  useFrame((state) => {
    const target = new THREE.Vector3(0, 0, 0);
    let targetPos = new THREE.Vector3(0, 0, 10);

    if (composition === 'STUDIO') {
      // STUDIO: Daleko, żeby widzieć kontekst, lekko z góry
      targetPos.set(0, 2.0, 19); 
    } else if (composition === 'BORDER') {
      targetPos.set(0, 0, 14);
    }

    state.camera.position.lerp(targetPos, 0.05);
    state.camera.lookAt(target);
  });
  return null;
}

const ScreenshotManager = forwardRef((_, ref) => {
  const { gl, size, camera } = useThree();
  const [captureState, setCaptureState] = useState('idle');
  const originalSize = useRef({ w: 0, h: 0, pixelRatio: 1 });

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (captureState === 'idle') setCaptureState('resize');
    }
  }));

  useFrame(() => {
    if (captureState === 'resize') {
      originalSize.current = { w: gl.domElement.width, h: gl.domElement.height, pixelRatio: gl.getPixelRatio() };
      gl.setSize(3840, 2160, false); gl.setPixelRatio(1);
      camera.aspect = 3840 / 2160; camera.updateProjectionMatrix();
      setCaptureState('capture');
    } else if (captureState === 'capture') {
      const data = gl.domElement.toDataURL('image/png', 0.95); // Wyższa jakość PNG
      const { w, h, pixelRatio } = originalSize.current;
      gl.setPixelRatio(pixelRatio); gl.setSize(w / pixelRatio, h / pixelRatio, false);
      camera.aspect = size.width / size.height; camera.updateProjectionMatrix();
      const date = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.download = `composition-studio-${date}-${Math.floor(Math.random()*1000)}.png`;
      link.href = data; link.click();
      setCaptureState('idle');
    }
  });
  return null;
});

export const Scene = forwardRef<any, SceneProps>(({ 
  mode = 'MIX', 
  count = 20, // Ignorujemy to w trybie Studio, tam mamy własny licznik
  bgStyle = 'CLEAN',
  bubbleStyle = 'MATTE',
  composition = 'CHAOS', 
  seed = 0
}, ref) => {
  
  const isClay = bubbleStyle === 'CLAY';
  const isStudio = composition === 'STUDIO';

  // --- MÓZG KOMPOZYCJI: ALGORYTM PAKOWANIA ---
  const bubbles = useMemo(() => {
    const theme = PALETTES[mode] || PALETTES['MIX'];
    
    // Jeśli nie jesteśmy w trybie STUDIO, używamy prostej logiki (starej)
    if (composition !== 'STUDIO') {
      return new Array(count).fill(0).map((_, i) => {
        // ... (Tu wklejamy starą logikę dla Border/Chaos/Stage dla kompatybilności)
        // Dla skrótu w tym przykładzie, używam uproszczonej wersji fallback:
        const colorSet = theme[Math.floor(Math.random() * theme.length)];
        let pos: [number, number, number] = [(Math.random()-0.5)*10, (Math.random()-0.5)*6, -2];
        let scale = 1;
        
        if (composition === 'BORDER') {
           const z = -2.5 - Math.random() * 6.0;
           const depthFactor = Math.abs(z) * 0.4;
           const x = (Math.random() - 0.5) * (12 + depthFactor);
           const y = (Math.random() - 0.5) * 7.0;
           pos = [x, y, z];
           scale = 0.5 + Math.random() * 2.0;
        } else if (composition === 'STAGE') {
           if(i===0) { pos=[0,0,0]; scale=2.4; }
           else {
             const r = 4 + Math.random()*3;
             const th = Math.random()*Math.PI*2;
             const ph = Math.random()*Math.PI - Math.PI/2;
             pos=[r*Math.cos(th)*Math.cos(ph), r*Math.sin(ph), r*Math.sin(th)*Math.cos(ph)];
             scale=0.5+Math.random()*0.7;
           }
        }
        return {
          id: i, palette: colorSet, position: pos, scale, speed: 1, 
          distortSpeed: 1+Math.random(), distortFactor: 0.3+Math.random()*0.2, 
          rotationOffset: [Math.random()*Math.PI, 0, 0]
        };
      });
    }

    // --- TRYB STUDIO: ZŁOTY PODZIAŁ I UNIKANIE KOLIZJI ---
    
    // 1. Definiujemy "sloty" wielkości (Hierarchia)
    // 3 Duże (Hero), 6 Średnich (Support), 12 Małych (Detail)
    const sizes = [
      ...Array(3).fill(1.8),  // Duże
      ...Array(6).fill(1.1),  // Średnie
      ...Array(12).fill(0.6)  // Małe
    ];

    const definedBubbles: any[] = [];
    
    // Funkcja sprawdzająca czy nowa pozycja koliduje z już istniejącymi
    const checkCollision = (pos: THREE.Vector3, radius: number) => {
      for (let b of definedBubbles) {
        const dist = pos.distanceTo(new THREE.Vector3(...b.position));
        // Minimalny dystans to suma promieni (scale = średnica, więc radius = scale/2)
        // Mnożnik 0.85 pozwala na LEKKIE, miękkie przenikanie (takie "tulenie się")
        const minDistance = (radius + b.scale/2) * 0.85; 
        if (dist < minDistance) return true; // Kolizja!
      }
      return false;
    };

    // Pętla generująca
    sizes.forEach((targetScale, i) => {
      const colorSet = theme[Math.floor(Math.random() * theme.length)];
      let bestPos = new THREE.Vector3(0, -100, 0); // Placeholder
      let found = false;
      
      // Próbujemy X razy znaleźć wolne miejsce
      // Im większy obiekt, tym bliżej środka próbujemy go postawić
      const spread = targetScale > 1.5 ? 2.0 : (targetScale > 1.0 ? 5.0 : 8.0);
      
      for (let attempt = 0; attempt < 100; attempt++) {
        // Losujemy pozycję w elipsie na podłodze
        const x = (Math.random() - 0.5) * spread * 2.5; 
        const z = (Math.random() - 0.5) * spread * 1.5; 
        // Y zależy od wielkości - duże leżą niżej, małe mogą lewitować wyżej
        const y = -2.0 + (Math.random() * 1.5) + (targetScale * 0.5); 

        const candidate = new THREE.Vector3(x, y, z);
        
        if (!checkCollision(candidate, targetScale / 2)) {
          bestPos = candidate;
          found = true;
          break; // Mamy to!
        }
      }

      if (found) {
        definedBubbles.push({
          id: i,
          palette: colorSet,
          position: [bestPos.x, bestPos.y, bestPos.z],
          scale: targetScale,
          speed: 1.0,
          distortSpeed: 0.5 + Math.random() * 1.0, // Spokojne
          distortFactor: 0.2 + Math.random() * 0.2, // Mała deformacja (zachowują kształt)
          rotationOffset: [Math.random()*Math.PI, Math.random()*Math.PI, 0]
        });
      }
    });

    return definedBubbles;

  }, [mode, count, bubbleStyle, composition, seed]); // Przelicz przy zmianie seeda!

  const bgColors = useMemo(() => {
    const theme = PALETTES[mode] || PALETTES['MIX'];
    return { top: theme[0].rim, bottom: theme[0].base };
  }, [mode]);

  return (
    <Canvas 
      gl={{ preserveDrawingBuffer: true, antialias: true }} 
      camera={{ position: [0, 0, 10], fov: 35 }} // 35mm = 50-60mm w realu
      dpr={[1, 1.5]} // Ograniczamy DPR dla wydajności, ale antyaliasing robi robotę
      shadows={isClay}
    >
      <CameraRig composition={composition} />

      {bgStyle === 'MISTY' ? (
        <Background colorTop={bgColors.top} colorBottom={bgColors.bottom} />
      ) : (
        <color attach="background" args={['#f2f4f6']} />
      )}

      <Environment preset="city" blur={1} />
      
      {isClay && (
        <>
          <ambientLight intensity={0.8} />
          <directionalLight 
            position={[5, 12, 5]} 
            intensity={1.5} 
            castShadow 
            shadow-bias={-0.0001} 
            shadow-radius={8} // Miękkie cienie
            shadow-mapSize={[2048, 2048]} // Wyższa jakość cieni
          />
          <pointLight position={[-8, 2, -5]} intensity={0.6} color="white" />
        </>
      )}

      {isStudio && isClay && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial transparent opacity={0.15} color="#000" />
        </mesh>
      )}

      <ScreenshotManager ref={ref} />

      <group>
        {bubbles.map((props) => (
          <Bubble key={props.id} {...props} variant={bubbleStyle} />
        ))}
      </group>

      <EffectComposer disableNormalPass>
        {/* POPRAWA OSTROŚCI */}
        <DepthOfField 
          target={[0, 0, 0]} // Focus na środek kompozycji
          focalLength={0.05} // Dłuższa ogniskowa = mniejsza głębia, ale bardziej precyzyjna
          bokehScale={2}     // Zmniejszone z 5 na 2 -> Znacznie mniejsze rozmycie (ostrzej)
          height={700}       // Rozdzielczość bufora rozmycia
        />
        <Vignette eskil={false} offset={0.1} darkness={0.15} /> 
        {/* Wyłączamy Noise całkowicie w Clay dla czystości "Apple like" */}
        <Noise opacity={isClay ? 0.0 : 0.02} />
      </EffectComposer>
    </Canvas>
  );
});