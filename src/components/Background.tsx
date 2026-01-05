// @ts-nocheck
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef, useMemo } from 'react';

// Shader obsługujący 4 narożniki (Bilinear Interpolation)
const GradientMaterial = shaderMaterial(
  {
    uC1: new THREE.Color('#ffffff'), // Top Left
    uC2: new THREE.Color('#ffffff'), // Top Right
    uC3: new THREE.Color('#000000'), // Bottom Left
    uC4: new THREE.Color('#000000'), // Bottom Right
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // Z=0.9999 spycha tło na sam koniec
      gl_Position = vec4(position.xy, 0.9999, 1.0); 
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uC1;
    uniform vec3 uC2;
    uniform vec3 uC3;
    uniform vec3 uC4;
    varying vec2 vUv;

    void main() {
      // Mieszamy górę (Lewo -> Prawo)
      vec3 top = mix(uC1, uC2, vUv.x);
      // Mieszamy dół (Lewo -> Prawo)
      vec3 bottom = mix(uC3, uC4, vUv.x);
      // Mieszamy wynik góry i dołu (Dół -> Góra, bo vUv.y rośnie w górę)
      vec3 finalColor = mix(bottom, top, vUv.y);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ GradientMaterial });

interface BackgroundProps {
  colors: string[]; // Oczekujemy tablicy 4 kolorów [TL, TR, BL, BR]
}

export const Background = ({ colors }: BackgroundProps) => {
  const matRef = useRef<any>(null);

  // Zabezpieczenie: upewniamy się, że mamy 4 kolory.
  // Jeśli przyjdą 2 (stary system), duplikujemy je.
  const safeColors = useMemo(() => {
    if (colors && colors.length === 4) return colors;
    if (colors && colors.length === 2) return [colors[0], colors[0], colors[1], colors[1]];
    return ['#fff', '#fff', '#000', '#000']; // Fallback
  }, [colors]);

  useFrame(() => {
    if (matRef.current) {
      // Płynne przejście kolorów (lerp)
      matRef.current.uC1.lerp(new THREE.Color(safeColors[0]), 0.05); // TL
      matRef.current.uC2.lerp(new THREE.Color(safeColors[1]), 0.05); // TR
      matRef.current.uC3.lerp(new THREE.Color(safeColors[2]), 0.05); // BL
      matRef.current.uC4.lerp(new THREE.Color(safeColors[3]), 0.05); // BR
    }
  });

  return (
    <mesh renderOrder={-100}>
      <planeGeometry args={[2, 2]} />
      {/* @ts-ignore */}
      <gradientMaterial 
        ref={matRef} 
        depthWrite={false} 
        depthTest={false} 
      />
    </mesh>
  );
};