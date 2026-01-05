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
import { generateLayout } from '../logic/LayoutEngine';
import type { CompositionType } from '../logic/LayoutEngine';

export type BackgroundStyle = 'CLEAN' | 'MISTY';
export type BubbleStyle = 'MATTE' | 'VIVID' | 'CLAY';
export type { CompositionType }; 

interface SceneProps {
  mode?: PaletteKey;
  count?: number;
  bgStyle?: BackgroundStyle;
  bubbleStyle?: BubbleStyle;
  composition?: CompositionType;
  seed?: number;
}

// --- KAMERA ---
const CameraRig = ({ composition }: { composition: CompositionType }) => {
  useFrame((state) => {
    let target = new THREE.Vector3(0, 0, 0);
    let targetPos = new THREE.Vector3(0, 0, 10);

    if (composition === 'STUDIO_SCENOGRAPHY') {
      target = new THREE.Vector3(0, -0.4, 0);
      targetPos.set(0, 0.5, 16); 
    } 
    else if (composition === 'STUDIO') {
      target = new THREE.Vector3(0, -1.2, 0);
      targetPos.set(0, 1.5, 19); 
    } 
    else if (composition === 'BORDER') {
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
    capture: () => { if (captureState === 'idle') setCaptureState('resize'); }
  }));

  useFrame(() => {
    if (captureState === 'resize') {
      originalSize.current = { w: gl.domElement.width, h: gl.domElement.height, pixelRatio: gl.getPixelRatio() };
      gl.setSize(3840, 2160, false); gl.setPixelRatio(1);
      camera.aspect = 3840 / 2160; camera.updateProjectionMatrix();
      setCaptureState('capture');
    } else if (captureState === 'capture') {
      const data = gl.domElement.toDataURL('image/png', 0.95);
      const { w, h, pixelRatio } = originalSize.current;
      gl.setPixelRatio(pixelRatio); gl.setSize(w / pixelRatio, h / pixelRatio, false);
      camera.aspect = size.width / size.height; camera.updateProjectionMatrix();
      const date = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.download = `composition-${date}-${Math.floor(Math.random()*1000)}.png`;
      link.href = data; link.click();
      setCaptureState('idle');
    }
  });
  return null;
});

export const Scene = forwardRef<any, SceneProps>(({ 
  mode = 'MIX', 
  count = 20, 
  bgStyle = 'CLEAN',
  bubbleStyle = 'MATTE',
  composition = 'CHAOS', 
  seed = 0
}, ref) => {
  
  const isClay = bubbleStyle === 'CLAY';
  const isStudio = composition === 'STUDIO';

  // Generowanie układu
  const bubbles = useMemo(() => {
    return generateLayout(count, composition || 'CHAOS', mode || 'MIX');
  }, [mode, count, composition, seed]);

  // --- LOGIKA KOLORÓW TŁA ---
  const bgGradientColors = useMemo(() => {
    const theme = PALETTES[mode] || PALETTES['MIX'];
    
    // Pobieramy kolory z tematu (Base=Ciemny, Rim=Jasny)
    const brandColorLight = theme[0].rim; 
    const brandColorDark = theme[0].base;

    if (mode === 'MIX') {
      // DLA MIX: 4 Różne kolory w narożnikach
      // [TopLeft, TopRight, BottomLeft, BottomRight]
      return [
        '#FF545E', // TM (Czerwony jasny)
        '#40B6FF', // LO (Niebieski jasny)
        '#DD48B1', // LP (Różowy jasny)
        '#1E53E5'  // ED (Granatowy)
      ];
    } else {
      // DLA POJEDYNCZYCH MAREK: Gradient Pionowy
      // TopLeft == TopRight (Góra)
      // BottomLeft == BottomRight (Dół)
      return [
        brandColorLight, // TL
        brandColorLight, // TR
        brandColorDark,  // BL
        brandColorDark   // BR
      ];
    }
  }, [mode]);

  return (
    <Canvas 
      gl={{ preserveDrawingBuffer: true, antialias: true }} 
      camera={{ position: [0, 0, 10], fov: 35 }} 
      dpr={[1, 1.5]}
      shadows={isClay}
    >
      <CameraRig composition={composition} />

      {/* Tło wyświetlamy tylko w trybie MISTY */}
      {bgStyle === 'MISTY' ? (
        // Przekazujemy tablicę 4 kolorów
        <Background colors={bgGradientColors} />
      ) : (
        // W trybie CLEAN jednolite jasne tło
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
            shadow-radius={8} 
            shadow-mapSize={[2048, 2048]} 
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
        <DepthOfField target={[0, 0, 0]} focalLength={0.05} bokehScale={2} height={700} />
        <Vignette eskil={false} offset={0.1} darkness={0.15} /> 
        <Noise opacity={isClay ? 0.0 : 0.02} />
      </EffectComposer>
    </Canvas>
  );
});