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
  stiffness?: number; // Nowa właściwość
}

export const Bubble = ({ 
  palette, 
  position, 
  scale, 
  speed, 
  variant = 'MATTE',
  distortSpeed = 2,
  distortFactor = 0.4,
  rotationOffset = [0, 0, 0],
  stiffness = 0.5
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

  // Dostrajamy fizykę "Float" w zależności od sztywności 
  // Twardsze obiekty są cięższe = unoszą się wolniej i mniej
  const floatIntensity = isClay ? (1 - stiffness * 0.5) * 0.8 : (isVivid ? 1.5 : 0.8);
  const floatSpeed = isClay ? (1 - stiffness * 0.3) * 0.8 : speed;

  return (
    <Float 
      speed={floatSpeed} 
      rotationIntensity={isClay ? 0.2 : 0.6} // Clay rotuje bardzo leniwie
      floatIntensity={floatIntensity}    
      position={position}
    >
      <mesh 
        scale={scale} 
        rotation={rotationOffset as any} 
      >
        <sphereGeometry args={[1, 128, 128]} />
        
        {isClay ? (
          // --- STYL CLAY: SOFT SOLID  ---
          <MeshDistortMaterial
            color={palette.mid}
            speed={distortSpeed}     
            distort={distortFactor}  
            radius={1}
            
            // PARAMETRY MATERIAŁU "STUDIO PROP" 
            roughness={0.35}      // Satynowy połysk (nie mat, nie lustro)
            metalness={0.1}       // Minimalny metal dla głębi koloru
            
            clearcoat={0.2}       // Lekka warstwa lakieru
            clearcoatRoughness={0.1} // Ostre odbicia na lakierze (highlighty)
            
            envMapIntensity={1.5} // Mocne światło studyjne
            bumpScale={0.01}      // Mikro-faktura (opcjonalnie)
          />
        ) : (
          // --- STARY STYL ---
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