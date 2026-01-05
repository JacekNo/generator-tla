// @ts-nocheck
import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { Float, MeshDistortMaterial, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --- 1. SHADER VIVID (VELVET) - NAPRAWIONY I USPOKOJONY ---
const VelvetGrainMaterial = shaderMaterial(
  {
    uTime: 0,
    // TU BYŁ BŁĄD: Nie możemy tu używać 'palette', bo ona tu nie istnieje.
    // Ustawiamy bezpieczne wartości domyślne (startowe).
    uColorBase: new THREE.Color('#000000'), 
    uColorMid: new THREE.Color('#888888'),
    uColorRim: new THREE.Color('#ffffff'),
    uGrainOpacity: 0.04,
    uDistortStrength: 0.1, // Uspokojona wartość
  },
  // Vertex Shader (Geometria)
  `
    uniform float uTime;
    uniform float uDistortStrength;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    // Simplex Noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      vec3 pos = position;
      
      // KLUCZOWA ZMIANA: Zmniejszona częstotliwość (0.6) i prędkość (0.15)
      // To sprawia, że fale są duże, powolne i "ciekłe", a nie chaotyczne.
      float noiseVal = snoise(vec3(pos.x * 0.6, pos.y * 0.6, uTime * 0.15));
      
      pos += normal * noiseVal * uDistortStrength;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader (Kolory)
  `
    uniform vec3 uColorBase;
    uniform vec3 uColorMid;
    uniform vec3 uColorRim;
    uniform float uGrainOpacity;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    float random(vec2 p) {
      return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);

      float fresnel = dot(viewDir, normal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);

      // Głębokie kolory (Velvet Look)
      float midMix = pow(fresnel, 2.5); 
      vec3 color = mix(uColorBase, uColorMid, midMix);

      float rimMix = pow(fresnel, 4.0);
      color = mix(color, uColorRim, rimMix);

      float grain = random(vUv + normal.xy * 2.0);
      color += (grain - 0.5) * uGrainOpacity;

      gl_FragColor = vec4(color, 1.0);
      
      #include <tonemapping_fragment>
      #include <colorspace_fragment> 
    }
  `
);

extend({ VelvetGrainMaterial });

// --- 2. KOMPONENT BUBBLE ---
interface BubbleProps {
  palette: { base: string; mid: string; rim: string };
  position: [number, number, number];
  scale: number;
  speed: number;
  variant?: 'MATTE' | 'VIVID' | 'CLAY';
  distortSpeed?: number;
  distortFactor?: number;
  rotationOffset?: [number, number, number];
  stiffness?: number;
  role?: string;
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
  stiffness = 0.5,
  role
}: BubbleProps) => {
  const materialRef = useRef<any>(null);
  
  const isClay = variant === 'CLAY';
  const isMatte = variant === 'MATTE';
  const isVivid = variant === 'VIVID';

  useFrame(({ clock }) => {
    // Animacja czasu tylko dla VIVID
    if (materialRef.current && isVivid && materialRef.current.uTime !== undefined) {
      materialRef.current.uTime = clock.getElapsedTime();
    }
  });

  const floatIntensity = isClay ? (1 - stiffness * 0.5) * 0.4 : 0.8;
  const floatSpeed = isClay ? (1 - stiffness * 0.3) * 0.2 : speed;
  const rotationIntensity = isClay ? 0.2 : 0.6;

  return (
    <Float 
      speed={floatSpeed} 
      rotationIntensity={rotationIntensity} 
      floatIntensity={floatIntensity}    
      position={position}
    >
      <mesh 
        scale={scale} 
        rotation={rotationOffset as any} 
        castShadow={true}      
        receiveShadow={true} 
      >
        <sphereGeometry args={[1, 128, 128]} />
        
        {isClay ? (
          // --- 1. CLAY (GUMMY) ---
          <MeshDistortMaterial
            ref={materialRef}
            side={THREE.FrontSide}
            speed={distortSpeed}     
            distort={distortFactor}  
            radius={1}
            color={palette.mid} 
            roughness={0.45}      
            metalness={0.1}       
            transmission={0.4}    
            thickness={3.0}       
            ior={1.45}            
            attenuationColor={palette.base} 
            attenuationDistance={1.5}
            clearcoat={0.1}       
            clearcoatRoughness={0.5}
            envMapIntensity={1.2} 
          />
        ) : isMatte ? (
          // --- 2. MATTE (PRZEZROCZYSTE/ETHEREAL) ---
          // To jest ten nowy kod, który chciałeś dodać
          <meshPhysicalMaterial
            color="#ffffff"        
            transmission={0.99}    // Max przezroczystości
            side={THREE.FrontSide}
            opacity={1}
            transparent={true}
            roughness={0.8}        // Idealnie gładkie
            metalness={0.0}
            ior={1.1}              // Bańka mydlana
            thickness={0.1}        
            sheen={1.0}            // Świecąca krawędź
            sheenRoughness={0.2}   
            sheenColor={palette.mid} // Kolor tylko na krawędzi
            envMapIntensity={1.5}  
            clearcoat={0.5}        
          />
        ) : (
          // --- 3. VIVID (VELVET) ---
          // Uspokojony shader
          // @ts-ignore
          <velvetGrainMaterial 
            ref={materialRef}
            side={THREE.FrontSide}
            uColorBase={new THREE.Color(palette.base)}
            uColorMid={new THREE.Color(palette.mid)}
            uColorRim={new THREE.Color(palette.rim)}
            uGrainOpacity={0.04}
            uDistortStrength={0.1} // Umiarkowana deformacja
          />
        )}
      </mesh>
    </Float>
  );
};