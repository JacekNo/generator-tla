// @ts-nocheck
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';

const GradientMaterial = shaderMaterial(
  {
    uColorA: new THREE.Color('#ffffff'),
    uColorB: new THREE.Color('#000000'),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // To rozciąga plane 2x2 na cały ekran
      // Ustawiamy z = 0.9999, żeby było na samym końcu (depth)
      gl_Position = vec4(position.xy, 0.9999, 1.0); 
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying vec2 vUv;
    void main() {
      vec3 color = mix(uColorA, uColorB, vUv.y);
      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ GradientMaterial });

interface BackgroundProps {
  colorTop: string;
  colorBottom: string;
}

export const Background = ({ colorTop, colorBottom }: BackgroundProps) => {
  const matRef = useRef<any>(null);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uColorA.lerp(new THREE.Color(colorBottom), 0.05);
      matRef.current.uColorB.lerp(new THREE.Color(colorTop), 0.05);
    }
  });

  return (
    // renderOrder={-100} wymusza rysowanie tego obiektu jako pierwszego (pod spodem)
    <mesh renderOrder={-100}>
      <planeGeometry args={[2, 2]} />
      {/* depthWrite={false} sprawia, że tło nie nadpisuje informacji o głębi */}
      <gradientMaterial 
        ref={matRef} 
        depthWrite={false} 
        depthTest={false} 
      />
    </mesh>
  );
};