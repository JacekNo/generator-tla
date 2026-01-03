// @ts-nocheck
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import '../materials/VelvetShader'; 

interface BubbleProps {
  palette: { base: string; mid: string; rim: string };
  position: [number, number, number];
  scale: number;
  speed: number;
  variant?: 'MATTE' | 'VIVID' | 'CLAY';
  distortSpeed?: number;
  distortFactor?: number;
  rotationOffset?: [number, number, number];
}

export const Bubble = ({ 
  palette, 
  position, 
  scale, 
  speed, 
  variant = 'MATTE',
  distortSpeed = 2,
  distortFactor = 0.4,
  rotationOffset = [0, 0, 0]
}: BubbleProps) => {
  const materialRef = useRef<any>(null);

  const isVivid = variant === 'VIVID';
  const isClay = variant === 'CLAY';
  
  const grainOpacity = isVivid ? 0.04 : 0.12; 
  const distortStrength = isVivid ? 0.6 : 0.25; 

  useFrame(({ clock }) => {
    if (materialRef.current && !isClay) {
      materialRef.current.uTime = clock.getElapsedTime();
    }
  });

  return (
    <Float 
      // ZMNIEJSZONE TEMPO: Dla Clay ustawiamy bardzo powolny dryf (0.4)
      speed={isClay ? speed * 0.4 : speed} 
      rotationIntensity={isClay ? 0.5 : (isVivid ? 1.0 : 0.6)} 
      floatIntensity={isClay ? 0.8 : (isVivid ? 1.5 : 0.8)}    
      position={position}
    >
      <mesh 
        scale={scale} 
        rotation={rotationOffset as any} 
      >
        <sphereGeometry args={[1, 128, 128]} />
        
        {isClay ? (
          <MeshDistortMaterial
            color={palette.mid}
            speed={distortSpeed}     
            distort={distortFactor}  
            radius={1}
            roughness={0.45}
            metalness={0.05}
            clearcoat={0.1}
            clearcoatRoughness={0.2}
            envMapIntensity={1.2}
          />
        ) : (
          // @ts-ignore
          <velvetGrainMaterial 
            ref={materialRef}
            uColorBase={new THREE.Color(palette.base)}
            uColorMid={new THREE.Color(palette.mid)}
            uColorRim={new THREE.Color(palette.rim)}
            uGrainOpacity={grainOpacity}
            uDistortStrength={distortStrength}
          />
        )}
      </mesh>
    </Float>
  );
};