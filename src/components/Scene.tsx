// @ts-nocheck
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, DepthOfField, Vignette, Noise } from '@react-three/postprocessing';
import { useMemo, forwardRef, useImperativeHandle, useState, useRef } from 'react';
import * as THREE from 'three';

import { PALETTES } from '../config/tokens';
import type { PaletteKey } from '../config/tokens';
import { Bubble } from './Bubble';
import { Signet } from './Signet';
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
      target = new THREE.Vector3(0, -1.2, 0); // Kamera też patrzy trochę niżej
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

// --- GŁÓWNA SCENA ---

export const Scene = forwardRef<any, SceneProps>(({ 
  mode = 'MIX', count = 20, bgStyle = 'CLEAN', bubbleStyle = 'MATTE', composition = 'CHAOS', seed = 0
}, ref) => {
  
  const bubbles = useMemo(() => {
    return generateLayout(count, composition || 'CHAOS', mode || 'MIX');
  }, [mode, count, composition, seed]);

  const bgGradientColors = useMemo(() => {
    const theme = PALETTES[mode] || PALETTES['MIX'];
    const brandColorLight = theme[0].rim; 
    const brandColorDark = theme[0].base;
    if (mode === 'MIX') return ['#FF545E', '#40B6FF', '#DD48B1', '#1E53E5'];
    else return [brandColorLight, brandColorLight, brandColorDark, brandColorDark];
  }, [mode]);

  // KONFIGURACJA DEPTH OF FIELD (POPRAWIONA)
  const dofProps = useMemo(() => {
    if (composition === 'CHAOS') {
      return {
        // FIX: Celujemy idealnie w sygnet (Z = -5)
        target: [0, 0, -5], 
        // FIX: FocalLength nieco mniejszy, by złapać szerszy zakres ostrości
        focalLength: 0.02, 
        // FIX: Zmniejszony bokeh z 6 na 4, żeby nie rozmywało krawędzi sygnetu
        bokehScale: 4, 
        height: 700
      };
    } else {
      return {
        target: [0, 0, 0], 
        focalLength: 0.05, 
        bokehScale: 2, 
        height: 700
      };
    }
  }, [composition]);

  return (
    <Canvas 
      gl={{ preserveDrawingBuffer: true, antialias: true }} 
      camera={{ position: [0, 0, 10], fov: 35 }} 
      dpr={[1, 1.5]}
      shadows
    >
      <CameraRig composition={composition} />

      {bgStyle === 'MISTY' ? <Background colors={bgGradientColors} /> : <color attach="background" args={['#ffffff']} />}

      <Environment preset="city" blur={5} />
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[5, 12, 5]} intensity={1.5} castShadow 
        shadow-mapSize={[2048, 2048]} shadow-radius={4} shadow-bias={-0.0005} shadow-normalBias={0.05}
      />
      <pointLight position={[-8, 2, -5]} intensity={0.6} color="white" />

      <ScreenshotManager ref={ref} />

      <group>
        {bubbles.map((props) => {
          if (props.role === 'SIGNET' && props.modelPath) {
            return (
              <Signet 
                key={props.id} 
                {...props} 
                modelPath={props.modelPath}
                mode={mode} 
                variant={bubbleStyle}
                bgStyle={bgStyle}
              />
            );
          }
          return <Bubble key={props.id} {...props} variant={bubbleStyle} />;
        })}
      </group>

      <EffectComposer disableNormalPass>
        <DepthOfField 
          target={dofProps.target as [number, number, number]} 
          focalLength={dofProps.focalLength} 
          bokehScale={dofProps.bokehScale} 
          height={dofProps.height} 
        />
        <Vignette eskil={false} offset={0.1} darkness={0.15} /> 
        <Noise opacity={bubbleStyle === 'CLAY' ? 0.02 : 0.0} />
      </EffectComposer>
    </Canvas>
  );
});