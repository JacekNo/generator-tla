import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

// Definicja materiału
const VelvetGrainMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorBase: new THREE.Color('#8a0000'),
    uColorMid: new THREE.Color('#E30613'),
    uColorRim: new THREE.Color('#ff8a8a'),
    uGrainScale: 1200.0, // Im wyższa wartość, tym drobniejsze ziarno
    uGrainOpacity: 0.12, // Subtelność faktury
    uDistortStrength: 0.2,
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uDistortStrength;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position;
      
      // Prosta, wydajna deformacja sinusoidalna
      float wave = sin(pos.y * 4.0 + uTime) * 0.5 + sin(pos.x * 3.5 + uTime * 0.8) * 0.5;
      pos += normal * wave * uDistortStrength * 0.15;

      vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -modelViewPosition.xyz;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `,
  // Fragment Shader
  `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    uniform vec3 uColorBase;
    uniform vec3 uColorMid;
    uniform vec3 uColorRim;
    uniform float uGrainScale;
    uniform float uGrainOpacity;

    float random(vec2 p) {
      return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      // Fresnel Logic
      float fresnel = dot(viewDir, normal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);

      // Gradient Mixing
      float midMix = smoothstep(0.0, 0.6, fresnel);
      float rimMix = pow(fresnel, 2.5);

      vec3 color = mix(uColorBase, uColorMid, midMix);
      color = mix(color, uColorRim, rimMix);

      // Micro-Grain Texture
      float grain = random(gl_FragCoord.xy / uGrainScale);
      vec3 grainedColor = color + (grain - 0.5) * uGrainOpacity;

      gl_FragColor = vec4(grainedColor, 1.0);
    }
  `
);

// Rejestracja w ekosystemie React Three Fiber
extend({ VelvetGrainMaterial });

// Typowanie dla TypeScript (aby nie krzyczał na <velvetGrainMaterial>)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      velvetGrainMaterial: any;
    }
  }
}

export { VelvetGrainMaterial };