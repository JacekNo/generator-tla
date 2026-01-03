/// <reference types="vite/client" />

import { Object3DNode } from '@react-three/fiber';
import { VelvetGrainMaterial } from './materials/VelvetShader';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      velvetGrainMaterial: Object3DNode<VelvetGrainMaterial, typeof VelvetGrainMaterial>;
    }
  }
}