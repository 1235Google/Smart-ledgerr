import React, { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, MeshTransmissionMaterial, RoundedBox, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';

export function ParallaxCamera() {
  const { camera, mouse } = useThree();
  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.5, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.5 + mouse.y * 0.5, 0.05);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function GlowEffect({ status }: { status: 'idle' | 'receiving' | 'sending' }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const color = new THREE.Color();
  
  useFrame((state, delta) => {
    if (!lightRef.current) return;
    
    let targetColor = '#3b82f6'; // Blue base glow
    let targetIntensity = 2.0;
    
    if (status === 'receiving') {
      targetColor = '#4ade80';
      targetIntensity = 5.0;
    } else if (status === 'sending') {
      targetColor = '#f87171';
      targetIntensity = 5.0;
    }
    
    color.set(targetColor);
    lightRef.current.color.lerp(color, delta * 4);
    
    if (status === 'idle') {
       const breathe = Math.sin(state.clock.elapsedTime * 1.5) * 0.5 + 2.0;
       lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, breathe, delta * 3);
    } else {
       lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, targetIntensity, delta * 5);
    }
  });

  return <pointLight ref={lightRef} position={[0, 0, 0]} distance={10} decay={2} />;
}

export function RupeeBundle({ position, rotation, scale = 1, type = 500 }: any) {
  const color = type === 500 ? "#8b9487" : type === 200 ? "#d97706" : "#7c3aed";
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.3, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0]}>
         <boxGeometry args={[0.2, 0.32, 0.62]} />
         <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>
    </group>
  )
}

export function GoldBar({ position, rotation, scale = 1 }: any) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
       <boxGeometry args={[0.8, 0.15, 0.4]} />
       <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
    </mesh>
  )
}

export function Coin({ position, rotation, scale = 1 }: any) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
       <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
       <meshStandardMaterial color="#f59e0b" metalness={1} roughness={0.2} />
    </mesh>
  )
}

export function WealthLayout({ balance, visible }: { balance: number, visible: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
     if (!meshRef.current) return;
     const targetScaleY = visible ? 1 : 0.001;
     meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScaleY, delta * 3);
  });

  const generateBundles = () => {
    const bundles = [];
    const count = Math.min(Math.floor(balance / 5000), 40); // 1 bundle = 5k
    for(let i=0; i<count; i++) {
       const x = (Math.random() - 0.5) * 2;
       const z = (Math.random() - 0.5) * 2;
       const y = -1.2 + (i * 0.05); // stack up
       const ry = Math.random() * Math.PI;
       const type = Math.random() > 0.7 ? 200 : (Math.random() > 0.8 ? 100 : 500);
       bundles.push(<RupeeBundle key={`bundle-${i}`} position={[x, y, z]} rotation={[0, ry, 0]} type={type} />);
    }
    return bundles;
  };

  const generateGold = () => {
    const golds = [];
    const count = Math.min(Math.floor(balance / 20000), 10);
    for(let i=0; i<count; i++) {
       const x = -0.8 + (Math.random() - 0.5);
       const z = 0.8 + (Math.random() - 0.5);
       const y = -1.35 + (i * 0.1);
       const ry = Math.random() * 0.5;
       golds.push(<GoldBar key={`gold-${i}`} position={[x, y, z]} rotation={[0, ry, 0]} />);
    }
    return golds;
  };

  const generateCoins = () => {
    const coins = [];
    const count = Math.min(Math.floor(balance / 1000), 30);
    for(let i=0; i<count; i++) {
       const x = 0.8 + (Math.random() - 0.5) * 1.2;
       const z = 0.8 + (Math.random() - 0.5) * 1.2;
       const y = -1.35 + (Math.random() * 0.2);
       const rx = Math.random() * Math.PI;
       const ry = Math.random() * Math.PI;
       coins.push(<Coin key={`coin-${i}`} position={[x, y, z]} rotation={[rx, ry, 0]} />);
    }
    return coins;
  };

  const elements = useMemo(() => {
    return [...generateBundles(), ...generateGold(), ...generateCoins()];
  }, [Math.floor(balance / 5000)]);

  return (
    <group ref={meshRef} scale={[1, 0.001, 1]}>
      {elements}
    </group>
  );
}

export function FlyingCash({ event }: { event: any }) {
  const meshRef = useRef<THREE.Group>(null);
  const startTime = useRef(performance.now());
  
  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = (performance.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / 1.5, 1);
    
    if (event.type === 'in') {
      meshRef.current.position.z = THREE.MathUtils.lerp(6, 0, progress);
      meshRef.current.position.y = THREE.MathUtils.lerp(4, 0, progress);
      meshRef.current.rotation.x = progress * Math.PI * 4;
      meshRef.current.rotation.y = progress * Math.PI * 2;
      meshRef.current.scale.setScalar(1 - progress);
    } else {
      meshRef.current.position.z = THREE.MathUtils.lerp(0, 6, progress);
      meshRef.current.position.y = THREE.MathUtils.lerp(0, 4, progress);
      meshRef.current.rotation.x = progress * Math.PI * 4;
      meshRef.current.rotation.y = progress * Math.PI * 2;
      meshRef.current.scale.setScalar(progress);
    }
  });

  return (
    <group ref={meshRef}>
      <RupeeBundle position={[0,0,0]} rotation={[0,0,0]} type={500} />
    </group>
  );
}

export function LuxuryVaultDisplay({ balance, status, cashEvents, prefersReducedMotion, vaultLoaded }: any) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current && !prefersReducedMotion) {
       groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * (Math.PI / 180 * 2);
    }
  });

  return (
    <group>
      <Float speed={1} rotationIntensity={0.02} floatIntensity={0.05}>
        <group position={[0, -2.5, 0]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[4.2, 4.5, 0.2, 64]} />
            <meshStandardMaterial color="#0a0b10" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.11, 0]}>
            <ringGeometry args={[4.0, 4.15, 64]} />
            <meshBasicMaterial color="#8b5cf6" />
          </mesh>
          <pointLight position={[0, -1, 0]} color="#8b5cf6" intensity={2} distance={8} />
        </group>
      </Float>

      <group ref={groupRef}>
        <GlowEffect status={status} />
        
        <Float speed={1.5} rotationIntensity={0.02} floatIntensity={0.1}>
          <RoundedBox args={[3.6, 0.2, 3.6]} radius={0.05} smoothness={4} position={[0, -1.8, 0]} castShadow receiveShadow>
             <meshPhysicalMaterial color="#f8fafc" metalness={1} roughness={0.08} clearcoat={1} />
          </RoundedBox>
          <RoundedBox args={[3.6, 0.2, 3.6]} radius={0.05} smoothness={4} position={[0, 1.8, 0]} castShadow receiveShadow>
             <meshPhysicalMaterial color="#f8fafc" metalness={1} roughness={0.08} clearcoat={1} />
          </RoundedBox>
          
          <RoundedBox args={[0.2, 3.4, 0.2]} radius={0.05} smoothness={4} position={[-1.7, 0, -1.7]} castShadow receiveShadow>
             <meshPhysicalMaterial color="#f8fafc" metalness={1} roughness={0.08} clearcoat={1} />
          </RoundedBox>
          <RoundedBox args={[0.2, 3.4, 0.2]} radius={0.05} smoothness={4} position={[1.7, 0, -1.7]} castShadow receiveShadow>
             <meshPhysicalMaterial color="#f8fafc" metalness={1} roughness={0.08} clearcoat={1} />
          </RoundedBox>
          <RoundedBox args={[0.2, 3.4, 0.2]} radius={0.05} smoothness={4} position={[-1.7, 0, 1.7]} castShadow receiveShadow>
             <meshPhysicalMaterial color="#f8fafc" metalness={1} roughness={0.08} clearcoat={1} />
          </RoundedBox>
          <RoundedBox args={[0.2, 3.4, 0.2]} radius={0.05} smoothness={4} position={[1.7, 0, 1.7]} castShadow receiveShadow>
             <meshPhysicalMaterial color="#f8fafc" metalness={1} roughness={0.08} clearcoat={1} />
          </RoundedBox>

          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[3.4, 3.4, 3.4]} />
            <MeshTransmissionMaterial 
              backside 
              samples={6} 
              thickness={3} 
              ior={1.5}
              chromaticAberration={0.02} 
              anisotropy={0.5}
              transmission={1} 
              roughness={0.02} 
              color="#e2e8f0" 
              attenuationColor="#bfdbfe"
              attenuationDistance={10}
            />
          </mesh>
          
          <WealthLayout balance={balance} visible={vaultLoaded} />
          
          <Sparkles count={50} scale={3} size={2} speed={0.2} opacity={0.8} color="#ffffff" position={[0, 0, 0]} />
          
          {!prefersReducedMotion && (
            <group>
               {cashEvents.filter((e: any) => performance.now() - e.createdAt < 2000).map((e: any) => (
                 <FlyingCash key={e.id} event={e} />
               ))}
            </group>
          )}
        </Float>
      </group>
    </group>
  );
}
