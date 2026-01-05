// @ts-nocheck
import { useMemo, useRef } from 'react';
import { Float, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BRAND_SIGNETS } from '../config/assets';
import './VelvetMaterial'; 
import type { BackgroundStyle } from './Scene';

Object.values(BRAND_SIGNETS).forEach(path => {
  if (path) useGLTF.preload(path);
});

interface SignetProps {
  modelPath: string;
  position: [number, number, number];
  scale: number;
  rotationOffset: [number, number, number];
  movement: { speed: number; floatIntensity: number; rotationIntensity: number; };
  palette?: { base: string; mid: string; rim: string };
  mode?: string;
  variant?: 'MATTE' | 'VIVID' | 'CLAY';
  bgStyle?: BackgroundStyle;
}

export const Signet = ({
  modelPath, position, scale, movement, palette, mode, variant = 'CLAY', bgStyle = 'CLEAN'
}: SignetProps) => {
  const { nodes } = useGLTF(modelPath);

  const geometry = useMemo(() => {
    let foundGeometry = null;
    Object.values(nodes).forEach((node: any) => {
      if (node.isMesh && !foundGeometry) {
        foundGeometry = node.geometry.clone();
        foundGeometry.center();
        foundGeometry.computeVertexNormals();
      }
    });
    return foundGeometry;
  }, [nodes]);

  const meshRef = useRef<THREE.Mesh>(null);

  // --- LOGIKA KOLORÓW ---
  const TEB_NAVY = '#102D69';
  const WHITE = '#FFFFFF';
  
  let mainColor = palette ? palette.mid : '#ffffff';
  
  const isMix = mode === 'MIX';
  const isMistyBg = bgStyle === 'MISTY';

  if (isMix) {
    mainColor = TEB_NAVY;
  } else if (isMistyBg) {
    mainColor = WHITE;
  }

  // --- RUCH (BALANS) ---
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      // Delikatne kołysanie (lewo-prawo, przód-tył) zamiast obracania w kółko
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;       // Oś Y (Rozglądanie)
      meshRef.current.rotation.z = Math.sin(t * 0.3 + 100) * 0.05; // Oś Z (Bujanie na boki)
      meshRef.current.rotation.x = Math.cos(t * 0.4) * 0.05;       // Oś X (Pochylenie)
    }
  });

  if (!geometry) return null;

  return (
    <Float
      speed={movement.speed}
      rotationIntensity={0} // Wyłączamy losową rotację z Floata
      floatIntensity={movement.floatIntensity}
      position={position}
    >
      <mesh 
        ref={meshRef}
        geometry={geometry} 
        scale={scale * 0.8} 
        rotation={[0, 0, 0]} 
        castShadow
        receiveShadow
      >
        {/* ZMIANA: Zawsze renderujemy jeden, solidny materiał.
           Niezależnie czy tryb to Bańka, Glutek czy Glina - Sygnet jest solidny.
        */}
        <meshStandardMaterial
          color={mainColor}
          roughness={0.4}  // Lekki mat (jak plastik/gips)
          metalness={0.1}  // Minimalny metalik dla odbić
          envMapIntensity={1.0}
        />
      </mesh>
    </Float>
  );
};