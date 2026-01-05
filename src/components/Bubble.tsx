// @ts-nocheck
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, useTexture, Decal } from '@react-three/drei';
import * as THREE from 'three';
import './VelvetMaterial'; 

// --- DECAL (ZDJĘCIE) ---
const ImageDecal = ({ imageUrl }: { imageUrl: string }) => {
  const texture = useTexture(imageUrl);
  
  // FIX: Zwiększamy skalę bazową do 2.0 (średnica kuli), żeby wypełnić wysokość
  const scaleBase = 2.0; 
  
  // Proporcje zdjęcia
  const aspect = texture.image ? (texture.image.width / texture.image.height) : 1;
  
  return (
    <>
      {/* Kula bazowa - przezroczysta */}
      <meshStandardMaterial transparent opacity={0} roughness={1} />
      
      {/* Naklejka ze zdjęciem */}
      <Decal 
        position={[0, 0, 1]} 
        rotation={[0, 0, 0]} 
        // Skalujemy, aby wypełnić format
        scale={[scaleBase * aspect, scaleBase, 1]} 
      >
        <meshBasicMaterial 
          map={texture} 
          transparent 
          polygonOffset 
          polygonOffsetFactor={-1} 
          // Opcjonalnie: toneMapped={false} sprawia, że kolory są żywsze
          toneMapped={true} 
        />
      </Decal>
    </>
  );
};

interface BubbleProps {
  palette: { base: string; mid: string; rim: string };
  position: [number, number, number];
  scale: number;
  movement: { speed: number; floatIntensity: number; rotationIntensity: number; };
  distortSpeed: number; distortFactor: number; rotationOffset: [number, number, number];
  variant?: 'MATTE' | 'VIVID' | 'CLAY';
  imageUrl?: string | null;
}

export const Bubble = ({ 
  palette, position, scale, movement, distortSpeed, distortFactor, rotationOffset, variant = 'CLAY', imageUrl = null
}: BubbleProps) => {
  const materialRef = useRef<any>(null);
  const hasImage = !!imageUrl;
  const finalRotation = hasImage ? [0, 0, 0] : rotationOffset;
  
  const isClay = variant === 'CLAY';
  const isMatte = variant === 'MATTE';
  const isVivid = variant === 'VIVID';

  useFrame(({ clock }) => {
    if (materialRef.current && isVivid && !hasImage && materialRef.current.uTime !== undefined) {
      materialRef.current.uTime = clock.getElapsedTime();
    }
  });

  return (
    <Float 
      speed={movement.speed} 
      rotationIntensity={hasImage ? 0.05 : movement.rotationIntensity}
      floatIntensity={movement.floatIntensity}    
      position={position}
    >
      <mesh scale={scale} rotation={finalRotation as any} castShadow={!hasImage} receiveShadow={!hasImage}>
        <sphereGeometry args={[1, 128, 128]} />
        
        {hasImage ? (
          <ImageDecal imageUrl={imageUrl} />
        ) : isClay ? (
          <MeshDistortMaterial
            ref={materialRef} side={THREE.FrontSide} speed={2} distort={0.3} radius={1} 
            color={palette.mid} roughness={0.7} metalness={0.0} envMapIntensity={0.8} 
          />
        ) : isMatte ? (
          // --- BAŃKA (MATTE / GLASS) - WERSJA LEKKA ---
          <meshPhysicalMaterial
            transparent={false}       // Fizyka szkła (transmission) nie lubi flagi transparent
            transmission={1.0}        // 100% światła przechodzi
            opacity={0.99}           // Prawie pełna nieprzezroczystość (zapobiega artefaktom)
            
            color="#ffffff"           // BAZA: Biała. Nie zmieniaj tego!
            
            // --- KLUCZOWE PARAMETRY WYGLĄDU ---
            roughness={0.1}           // Gładkość (0 = lustro, 1 = mat)
            metalness={0.0}
            ior={1.1}                 // 1.1 = Cienkie szkło/Bańka mydlana (1.5 to typowe szkło)
            thickness={0.2}           // Grubość ścianki: 0.1 = cieniutka skorupka
            
            attenuationColor={palette.mid} // Kolor tinty
            attenuationDistance={13.0}     // <--- TU STERUJESZ INTENSYWNOŚCIĄ KOLORU
                                           // 1.0 = Gęsty sok
                                           // 5.0 = Grube szkło
                                           // 20.0 = Czysta woda / Bańka
            
            sheen={1.0}               // Połysk na krawędziach
            sheenColor={palette.mid}  // Kolor połysku
            envMapIntensity={1.5}     // Moc odbić otoczenia
            clearcoat={1.0}           // Dodatkowa warstwa lakieru dla błysku
          />
        ) : (
          // @ts-ignore
          <velvetGrainMaterial 
            ref={materialRef} side={THREE.FrontSide}
            uColorBase={new THREE.Color(palette.base)}
            uColorMid={new THREE.Color(palette.mid)}
            uColorRim={new THREE.Color(palette.rim)}
            uGrainOpacity={0.04} uDistortStrength={0.05}
          />
        )}
      </mesh>
    </Float>
  );
};